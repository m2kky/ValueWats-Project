require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const instanceRoutes = require('./routes/instances');
const campaignRoutes = require('./routes/campaigns');
const webhookRoutes = require('./routes/webhooks');
const chatRoutes = require('./routes/chat');
const agentRoutes = require('./agents/agent.routes');

const integrationRoutes = require('./routes/integrations');
const workflowRoutes = require('./routes/workflows');

// Middleware
const tenantContext = require('./middleware/tenantContext');

const http = require('http');
const socketService = require('./services/socketService');
const { workflowQueue } = require('./services/workflowQueue'); // Initialize BullMQ wait queue

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
app.use(cors({
  origin: [
    'https://valuechat.app',
    'http://valuechat.app',
    'https://www.valuechat.app',
    'http://www.valuechat.app',
    'http://j4k0g4s4kssk8g0wksg0csk8.72.62.50.238.sslip.io',
    'http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io',
    /^https?:\/\/[a-z0-9-]+\.72\.62\.50\.238\.sslip\.io$/, // Strictly matching Coolify VPS subdomains
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ====== Fix 1.3: Rate Limiting ======
// Auth routes: 20 requests per 15 minutes (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});
// Webhook routes: 500 requests per minute (prevent DoS while allowing high throughput)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Webhook rate limit exceeded.' }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      evolutionApi: process.env.EVOLUTION_API_URL ? 'configured' : 'missing',
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      redis: process.env.REDIS_HOST ? 'configured' : 'missing',
      ai: process.env.OPENROUTER_API_KEY ? 'configured' : 'missing',
      backendUrl: process.env.BACKEND_URL || 'missing',
      socket: 'active'
    }
  });
});

// Fix 7.6: Health check at /api/health (alias)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Public routes (no authentication required)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', authRoutes); // Fallback for stripped /api prefix
app.use('/api/plans', require('./routes/plans'));

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
app.use('/api/settings', tenantContext, require('./routes/settings'));
app.use('/api/notifications', tenantContext, require('./routes/notifications'));
app.use('/api/workflows', tenantContext, workflowRoutes);

// Super Admin Routes (Protected internally by isAdmin middleware)
app.use('/api/admin', require('./routes/admin'));

// Public routes (Webhooks)
app.use('/api/webhooks', webhookLimiter, webhookRoutes);
app.use('/api/oauth', require('./routes/oauth'));

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
  
  // Mask detailed database/application errors in production to prevent information leakage
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction ? 'Internal server error' : (err.message || 'Internal server error');

  res.status(err.status || 500).json({
    error: errorMessage,
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

  // Fix 2.3: Initialize MinIO bucket once at boot (not per-upload)
  const { initBucket } = require('./services/storageService');
  initBucket().catch(err => console.error('[Boot] MinIO bucket init failed:', err.message));

  // Start campaign scheduler
  const { startScheduler } = require('./services/schedulerService');
  startScheduler();
});

module.exports = app;
