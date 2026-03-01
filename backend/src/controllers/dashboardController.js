const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    // 1. Get Campaign Counts
    // We want: Total Campaigns
    const totalCampaigns = await prisma.campaign.count({
      where: { tenantId }
    });

    // 2. Get Message Stats
    // We want: Total Messages, Sent, Delivered, Read, Failed
    const messageStats = await prisma.message.groupBy({
      by: ['status'],
      where: {
        tenantId,
        // Optional: filter by date range if passed in query params
      },
      _count: {
        id: true
      }
    });

    const stats = {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: 0
    };

    messageStats.forEach(stat => {
      const count = stat._count.id;
      stats.total += count;

      const status = stat.status.toLowerCase();
      if (status === 'sent') stats.sent += count;
      else if (status === 'delivered') stats.delivered += count;
      else if (status === 'read') stats.read += count;
      else if (status === 'failed') stats.failed += count;
      else if (status === 'pending') stats.pending += count;
    });

    // Note: 'delivered' usually implies 'sent', and 'read' implies 'delivered'.
    // Depending on how we want to display, we might want cumulative counts.
    // For now, let's keep them as mutually exclusive buckets based on current status.

    // 3. Get Active Instances
    const activeInstances = await prisma.instance.count({
      where: {
        tenantId,
        status: 'connected'
      }
    });

    // 4. Get Total Contacts (Unique recipients)
    // Prisma doesn't support distinct count on non-unique fields directly efficiently in all DBs via count()
    // But for postgres we can do filtered count or just count all messages recipients? 
    // Actually, "Contacts" usually implies unique people. 
    // Since we don't have a specific Contact model yet (it's embedded in messages/campaigns), 
    // we might just return total messages as proxy or 0 for now until we have a Contact book.
    // Or we can count distinct recipientNumbers from Messages.

    // Let's use total messages for now as "Touchpoints" or similar, 
    // or just return 0 if we don't have a contact book.
    // Actually, the dashboard card says "Total Contacts". 
    // Let's query distinct recipientNumber from Message table for now.

    const uniqueContacts = await prisma.message.findMany({
      where: { tenantId },
      distinct: ['recipientNumber'],
      select: { recipientNumber: true }
    });
    const totalContacts = uniqueContacts.length;

    // 5. Calculate Rates
    const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
    const readRate = stats.delivered > 0 ? (stats.read / stats.delivered) * 100 : 0;

    // 6. AI Agent Metrics
    const aiMessages = await prisma.chatMessage.count({
      where: {
        tenantId,
        direction: 'outgoing',
        // In our system, AI messages are usually marked via metadata 
        // or we can count messages from sessions where an agent was active
      }
    });

    const aiSessionsCount = await prisma.conversationAgent.count({
      where: {
        agent: { tenantId }
      }
    });

    const escalations = await prisma.conversation.count({
      where: { tenantId, escalated: true }
    });

    // 7. Recent Campaigns
    const recentCampaigns = await prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { messages: true }
        }
      }
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
            sentMessages: {
              where: { direction: 'outgoing' }
            }
          }
        }
      }
    });

    const teamInsights = teamMembers.map(u => ({
      id: u.id,
      name: u.email.split('@')[0], // Extract name from email for display
      role: u.role,
      messagesReplied: u._count.sentMessages
    })).sort((a, b) => b.messagesReplied - a.messagesReplied);

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
      teamInsights // added to response
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
