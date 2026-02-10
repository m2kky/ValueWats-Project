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

    // 5. Recent Campaigns
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

    res.json({
      campaigns: totalCampaigns,
      messages: stats,
      instances: activeInstances,
      contacts: totalContacts,
      recentCampaigns: recentCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
        messageCount: c._count.messages
      }))
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = {
  getStats
};
