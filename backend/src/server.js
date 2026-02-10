require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Routes
const authRoutes = require('./routes/auth');
const instanceRoutes = require('./routes/instances');
const campaignRoutes = require('./routes/campaigns');
const webhookRoutes = require('./routes/webhooks');

// Middleware
const tenantContext = require('./middleware/tenantContext');

const http = require('http');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const io = socketService.init(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      evolutionApi: process.env.EVOLUTION_API_URL ? 'configured' : 'missing',
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      redis: process.env.REDIS_HOST ? 'configured' : 'missing',
      ai: process.env.DEEPSEEK_API_KEY ? 'configured' : 'missing',
      backendUrl: process.env.BACKEND_URL || 'missing',
      socket: 'active'
    }
  });
});

// ... (routes remain same)
// Public routes (no authentication required)
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);

// Protected routes
app.use('/api/instances', tenantContext, instanceRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', require('./routes/dashboard'));

// Public routes (Webhooks)
app.use('/api/webhooks', webhookRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
