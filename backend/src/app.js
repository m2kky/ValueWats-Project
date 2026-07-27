const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { assertMetaTokenEncryptionConfigured } = require('./meta/metaTokenCrypto');

const route = (value, dependencies) => (typeof value === 'function' && !value.stack ? value(dependencies) : value);

function createApp({ routes = {}, middleware = {}, dependencies = {} } = {}) {
  if (process.env.NODE_ENV === 'production') assertMetaTokenEncryptionConfigured();

  const app = express();
  const tenantContext = middleware.tenantContext;
  const withTenant = (prefix, name) => {
    if (tenantContext && routes[name]) app.use(prefix, tenantContext, route(routes[name], dependencies));
  };

  app.locals.dependencies = dependencies;
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } }));
  if (routes.webhooks) app.use('/api/webhooks/meta', express.raw({ type: 'application/json', limit: '1mb' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cors({
    origin: [
      'https://valuechat.app', 'http://valuechat.app', 'https://www.valuechat.app', 'http://www.valuechat.app',
      'http://j4k0g4s4kssk8g0wksg0csk8.72.62.50.238.sslip.io', 'http://i0kwck044gc80s0osco8w0wg.72.62.50.238.sslip.io',
      /^https?:\/\/[a-z0-9-]+\.72\.62\.50\.238\.sslip\.io$/, 'http://localhost:5173', 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many authentication attempts. Please try again later.' } });
  const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false, message: { error: 'Webhook rate limit exceeded.' } });

  app.get('/health', (req, res) => res.json({
    status: 'ok', timestamp: new Date().toISOString(), services: {
      evolutionApi: process.env.EVOLUTION_API_URL ? 'configured' : 'missing', database: process.env.DATABASE_URL ? 'configured' : 'missing',
      redis: process.env.REDIS_HOST ? 'configured' : 'missing', ai: process.env.OPENROUTER_API_KEY ? 'configured' : 'missing',
      backendUrl: process.env.BACKEND_URL || 'missing', socket: 'active'
    }
  }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));

  if (routes.auth) {
    app.use('/api/auth', authLimiter, route(routes.auth, dependencies));
    app.use('/auth', route(routes.auth, dependencies));
  }
  ['plans', 'onboarding'].forEach((name) => { if (routes[name]) app.use(`/api/${name}`, route(routes[name], dependencies)); });
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  [
    ['instances', '/api/instances'], ['campaigns', '/api/campaigns'], ['dashboard', '/api/dashboard'], ['automations', '/api/automations'],
    ['team', '/api/team'], ['chat', '/api/chat'], ['agents', '/api/agents'], ['knowledge', '/api/agents'], ['lifecycle', '/api/lifecycle'],
    ['contacts', '/api/contacts'], ['templates', '/api/templates'], ['contactFields', '/api/contact-fields'], ['tags', '/api/tags'],
    ['snippets', '/api/snippets'], ['lifecycleRules', '/api/lifecycle-rules'], ['integrations', '/api/integrations'], ['segments', '/api/segments'],
    ['settings', '/api/settings'], ['notifications', '/api/notifications'], ['workflows', '/api/workflows']
  ].forEach(([name, prefix]) => withTenant(prefix, name));
  if (routes.admin) app.use('/api/admin', route(routes.admin, dependencies));
  if (routes.webhooks) app.use('/api/webhooks', webhookLimiter, route(routes.webhooks, dependencies));
  if (routes.oauth) app.use('/api/oauth', route(routes.oauth, dependencies));

  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get(/.*/, (req, res) => req.path.startsWith('/api') ? res.status(404).json({ error: 'Route not found' }) : res.sendFile(path.join(frontendPath, 'index.html')));
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error') });
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'API Route not found' }));
  return app;
}

module.exports = { createApp };
