const socketIo = require('socket.io');

let io;

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // Allow all origins for now (adjust for production)
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('[Socket] New client connected:', socket.id);

    // Join room based on tenant or campaign
    socket.on('join_campaign', (campaignId) => {
      socket.join(`campaign_${campaignId}`);
      console.log(`[Socket] Client ${socket.id} joined campaign_${campaignId}`);
    });

    socket.on('join_tenant', (tenantId) => {
      socket.join(`tenant_${tenantId}`);
      console.log(`[Socket] Client ${socket.id} joined tenant_${tenantId}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper to emit campaign progress updates
const emitCampaignProgress = (campaignId, tenantId, data) => {
  if (io) {
    // Emit to specific campaign room (for details page)
    io.to(`campaign_${campaignId}`).emit('campaign_progress', data);
    
    // Emit to tenant room (for global progress bar)
    if (tenantId) {
      io.to(`tenant_${tenantId}`).emit('campaign_progress', {
        ...data,
        campaignId // Ensure campaignId is in the payload
      });
    }
  }
};

module.exports = {
  init,
  getIo,
  emitCampaignProgress
};
