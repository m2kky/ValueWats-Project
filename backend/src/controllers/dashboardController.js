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

    // 3. Get Active Instances
    const activeInstances = await prisma.instance.count({
      where: { tenantId, status: 'connected' }
    });

    // 4. Get Total Contacts -> we can just use the number of unique conversations as "reach"
    const totalContacts = await prisma.conversation.count({
      where: { tenantId }
    });

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
        email: true,
        role: true,
        _count: {
          select: {
            sentMessages: { where: { direction: 'outgoing' } }
          }
        }
      }
    });

    const teamInsights = teamMembers.map(u => ({
      id: u.id,
      name: u.email.split('@')[0],
      role: u.role,
      messagesReplied: u._count.sentMessages
    })).sort((a, b) => b.messagesReplied - a.messagesReplied);

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
      contacts: totalContacts,
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
