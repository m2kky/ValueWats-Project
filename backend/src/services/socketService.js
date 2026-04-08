const socketIo = require('socket.io');

let io;

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: [
        'https://valuechat.app',
        'http://valuechat.app',
        'https://www.valuechat.app',
        'http://www.valuechat.app',
        'http://j4k0g4s4kssk8g0wksg0csk8.72.62.50.238.sslip.io',
        'http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io',
        /^https?:\/\/[a-z0-9-]+\.72\.62\.50\.238\.sslip\.io$/,
        'http://localhost:5173',
        'http://localhost:3000'
      ],
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

// Helper to emit chat message events
const emitChatMessage = (tenantId, eventName, data) => {
  if (io) {
    const room = `tenant_${tenantId}`;
    const clients = io.sockets.adapter.rooms.get(room);
    const count = clients ? clients.size : 0;
    console.log(`[Socket] Emitting ${eventName} to ${room} (${count} clients)`);
    io.to(room).emit(eventName, data);
  } else {
    console.warn(`[Socket] Cannot emit ${eventName} — io not initialized`);
  }
};

module.exports = {
  init,
  getIo,
  emitCampaignProgress,
  emitChatMessage
};
