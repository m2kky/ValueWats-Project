require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const instanceRoutes = require('./routes/instances');
const campaignRoutes = require('./routes/campaigns');
const webhookRoutes = require('./routes/webhooks');
const chatRoutes = require('./routes/chat');
const agentRoutes = require('./agents/agent.routes');

const integrationRoutes = require('./routes/integrations');

// Middleware
const tenantContext = require('./middleware/tenantContext');

const http = require('http');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const io = socketService.init(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP — frontend inline scripts (crypto polyfill) need to run
  crossOriginEmbedderPolicy: false,  // Allow loading cross-origin resources (fonts, images)
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } // Allow Google OAuth popup
}));
// ✅ Increase payload limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration
// CORS configuration
app.use(cors({
  origin: [
    'https://app.muhammedmekky.com',
    'http://app.muhammedmekky.com',
    'https://apptest.muhammedmekky.com',
    'http://apptest.muhammedmekky.com',
    'http://j4k0g4s4kssk8g0wksg0csk8.72.62.50.238.sslip.io',
    'http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io',
    /\.sslip\.io$/,
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Fallback for stripped /api prefix

// Onboarding (protected but separate from tenant-scoped routes)
app.use('/api/onboarding', require('./routes/onboarding'));

// Serve uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Protected routes
app.use('/api/instances', tenantContext, instanceRoutes);
app.use('/api/campaigns', tenantContext, campaignRoutes);
app.use('/api/dashboard', tenantContext, require('./routes/dashboard'));
app.use('/api/automations', tenantContext, require('./routes/automations'));
app.use('/api/team', tenantContext, require('./routes/team'));
app.use('/api/chat', tenantContext, chatRoutes);
app.use('/api/agents', tenantContext, agentRoutes);
app.use('/api/agents', tenantContext, require('./agents/knowledge.routes'));
app.use('/api/lifecycle', tenantContext, require('./routes/lifecycle.routes'));
app.use('/api/contacts', tenantContext, require('./routes/contacts'));
app.use('/api/templates', tenantContext, require('./routes/templates'));
app.use('/api/contact-fields', tenantContext, require('./routes/contactFields.routes'));
app.use('/api/tags', tenantContext, require('./routes/tags.routes'));
app.use('/api/snippets', tenantContext, require('./routes/snippets.routes'));
app.use('/api/lifecycle-rules', tenantContext, require('./routes/lifecycleRules.routes'));
app.use('/api/integrations', tenantContext, require('./routes/integrations'));
app.use('/api/segments', tenantContext, require('./routes/segments'));

// Super Admin Routes (Protected internally by isAdmin middleware)
app.use('/api/admin', require('./routes/admin'));

// Public routes (Webhooks)
app.use('/api/webhooks', webhookRoutes);

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all route to serve index.html for client-side routing
app.get(/.*/, (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start campaign scheduler
  const { startScheduler } = require('./services/schedulerService');
  startScheduler();
});

module.exports = app;
