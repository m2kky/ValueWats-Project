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
const emitCampaignProgress = (campaignId, data) => {
  if (io) {
    io.to(`campaign_${campaignId}`).emit('campaign_progress', data);
  }
};

module.exports = {
  init,
  getIo,
  emitCampaignProgress
};
