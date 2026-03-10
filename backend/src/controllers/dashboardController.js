const prisma = require('../config/database');

const getStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    // 1. Get Campaign Counts
    const totalCampaigns = await prisma.campaign.count({
      where: { tenantId }
    });

    // 2. Get Message Stats (Campaign Messages)
    const campaignMessageStats = await prisma.message.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true }
    });

    // 2.5 Get Inbox Chat Message Stats
    const chatMessageStats = await prisma.chatMessage.groupBy({
      by: ['status', 'direction'],
      where: {
        conversation: { tenantId }
      },
      _count: { id: true }
    });

    const stats = {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: 0
    };

    // Aggregate Campaign Messages
    campaignMessageStats.forEach(stat => {
      const count = stat._count.id;
      stats.total += count;
      const status = stat.status.toLowerCase();
      if (status === 'sent') stats.sent += count;
      else if (status === 'delivered') stats.delivered += count;
      else if (status === 'read') stats.read += count;
      else if (status === 'failed') stats.failed += count;
      else if (status === 'pending') stats.pending += count;
    });

    // Aggregate Inbox Messages (Outgoing only, or count both as total traffic)
    let aiMessages = 0;
    chatMessageStats.forEach(stat => {
      const count = stat._count.id;
      stats.total += count; // Count all inbox activity as well
      const status = stat.status.toLowerCase();

      // We only care about delivery statuses for outgoing messages mostly
      if (stat.direction === 'outgoing') {
        if (status === 'sent') stats.sent += count;
        else if (status === 'delivered') stats.delivered += count;
        else if (status === 'read') stats.read += count;
        else if (status === 'error' || status === 'failed') stats.failed += count;
        else if (status === 'pending') stats.pending += count;
      }
    });

    // In our ChatMessages, AI messages are often tracked uniquely, but for now we'll 
    // count the ones generated without a senderUserId as AI messages
    aiMessages = await prisma.chatMessage.count({
      where: {
        conversation: { tenantId },
        direction: 'outgoing',
        senderUserId: null
      }
    });

    // 3. Get Active Instances + disconnected
    const activeInstances = await prisma.instance.count({ where: { tenantId, status: 'connected' } });
    const disconnectedInstances = await prisma.instance.findMany({
      where: { tenantId, status: { in: ['disconnected', 'qr_pending'] } },
      select: { id: true, instanceName: true, status: true }
    });

    // 4. Conversations
    const totalContacts = await prisma.conversation.count({ where: { tenantId } });
    const openConversations = await prisma.conversation.count({ where: { tenantId, status: 'open' } });
    const pendingConversations = await prisma.conversation.count({ where: { tenantId, status: 'pending' } });

    // 5. Calculate Rates
    // Sent metric usually denotes successful transfer to WhatsApp node, so delivered is a subset of sent.
    const attemptCount = stats.sent + stats.delivered + stats.read;
    const deliveryRate = attemptCount > 0 ? ((stats.delivered + stats.read) / attemptCount) * 100 : 0;
    const readRate = (stats.delivered + stats.read) > 0 ? (stats.read / (stats.delivered + stats.read)) * 100 : 0;

    // 6. AI Agent Metrics
    const aiSessionsCount = await prisma.conversationAgent.count({
      where: { agent: { tenantId } }
    });

    const escalations = await prisma.conversation.count({
      where: { tenantId, escalated: true }
    });

    // 7. Recent Campaigns
    const recentCampaigns = await prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { messages: true } } }
    });

    // 8. Team Insights
    const teamMembers = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: { sentMessages: true }
        }
      }
    });

    const teamInsights = teamMembers.map(u => ({
      id: u.id,
      name: u.name || u.email.split('@')[0],
      role: u.role,
      messagesReplied: u._count.sentMessages
    })).sort((a, b) => b.messagesReplied - a.messagesReplied);

    // 10. Leads by Lifecycle Stage
    const lifecycleStages = await prisma.lifecycleStage.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        emoji: true,
        color: true,
        _count: { select: { contacts: true } }
      }
    });

    const totalLeads = lifecycleStages.reduce((sum, s) => sum + s._count.contacts, 0);
    const leadsByStage = lifecycleStages.map(s => ({
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      color: s.color,
      count: s._count.contacts,
      percent: totalLeads > 0 ? Math.round((s._count.contacts / totalLeads) * 100) : 0
    }));

    // 11. Total contacts (real Contact table)
    const totalRealContacts = await prisma.contact.count({ where: { tenantId } });

    // 12. Failed messages last 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    const recentFailed = await prisma.message.findMany({
      where: { tenantId, status: 'failed', createdAt: { gte: twoDaysAgo } },
      select: { createdAt: true, failReason: true, recipientNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // 13. Top keywords from last 200 incoming chat messages
    const recentIncoming = await prisma.chatMessage.findMany({
      where: { conversation: { tenantId }, direction: 'incoming', messageType: 'text', content: { not: null } },
      select: { content: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    const stopWords = new Set(['the','a','an','is','in','on','at','to','for','of','and','or','i','you','my','me','we','it','this','that','with','have','be','do','not','are','was','but','so','if','as','by','from','your','our','can','will','just','what','how','when','where','who','yes','no','ok','hi','hello','hey','thanks','thank','please','help']);
    const wordCount = {};
    recentIncoming.forEach(m => {
      m.content.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff\s]/g, '').split(/\s+/).forEach(w => {
        if (w.length > 2 && !stopWords.has(w)) wordCount[w] = (wordCount[w] || 0) + 1;
      });
    });
    const topKeywords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));

    // 14. Avg response time (minutes) — first outgoing after each incoming, last 7 days
    const avgResponseTime = await prisma.$queryRaw`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (o.created_at - i.created_at)) / 60)::numeric, 1) as avg_minutes
      FROM chat_messages i
      JOIN conversations c ON c.id = i.conversation_id
      JOIN LATERAL (
        SELECT created_at FROM chat_messages
        WHERE conversation_id = i.conversation_id AND direction = 'outgoing' AND created_at > i.created_at
        ORDER BY created_at ASC LIMIT 1
      ) o ON true
      WHERE c.tenant_id = ${tenantId}
        AND i.direction = 'incoming'
        AND i.created_at >= NOW() - INTERVAL '7 days'
        AND EXTRACT(EPOCH FROM (o.created_at - i.created_at)) / 60 < 1440
    `;

    // 9. Message Timeline (Last 7 Days) for Charting
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days including today
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentMessages = await prisma.message.findMany({
      where: {
        tenantId,
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true, status: true }
    });

    const timelineMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      timelineMap[dateStr] = {
        name: d.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue, etc.
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      };
    }

    recentMessages.forEach(m => {
      // we need to match local date strings, using toLocaleDateString('en-CA') as quick YYYY-MM-DD standard
      const dateStr = m.createdAt.toLocaleDateString('en-CA');
      if (timelineMap[dateStr]) {
        const s = m.status.toLowerCase();
        if (s === 'sent') timelineMap[dateStr].sent++;
        else if (s === 'delivered') timelineMap[dateStr].delivered++;
        else if (s === 'read') timelineMap[dateStr].read++;
        else if (s === 'error' || s === 'failed') timelineMap[dateStr].failed++;
      }
    });

    const messagesTimeline = Object.values(timelineMap);

    res.json({
      campaigns: totalCampaigns,
      messages: {
        ...stats,
        deliveryRate: deliveryRate.toFixed(1),
        readRate: readRate.toFixed(1)
      },
      instances: activeInstances,
      disconnectedInstances,
      contacts: totalRealContacts,
      conversations: totalContacts,
      openConversations,
      pendingConversations,
      ai: {
        messagesHandled: aiMessages,
        escalationRate: aiMessages > 0 ? ((escalations / aiMessages) * 100).toFixed(1) : 0,
        activeSessions: aiSessionsCount
      },
      recentCampaigns: recentCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
        messageCount: c._count.messages
      })),
      teamInsights,
      teamTotal: teamMembers.length,
      leadsByStage,
      totalLeads,
      recentFailed,
      topKeywords,
      avgResponseTime: Number(avgResponseTime[0]?.avg_minutes) || 0,
      timeline: messagesTimeline
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

const getActivityFeed = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const activity = await prisma.activityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        contact: {
          select: { name: true, phoneNumber: true }
        }
      }
    });

    const total = await prisma.activityLog.count({ where: { tenantId } });

    res.json({
      activity,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Activity Feed Error:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
};

module.exports = {
  getStats,
  getActivityFeed
};
