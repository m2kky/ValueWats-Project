const verifyWebhookContext = (req, res, next) => {
  const incomingApiKey = req.headers['apikey'] || req.headers['x-api-key'] || req.headers['x-webhook-secret'];
  
  const expectedKey = process.env.EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY;

  if (!expectedKey) {
    console.warn('[Security] Evolution Webhook secret is not configured in environment variables.');
    // If no secret is configured securely, we should technically reject, but to prevent breaking existing setups without notice,
    // we might allow it or strictly enforce it. Given this is a security patch, we enforce it.
    console.error('[Security] Blocking webhook request because EVOLUTION_API_KEY is missing from environment.');
    return res.status(500).json({ error: 'Server misconfiguration: missing webhook secret' });
  }

  if (!incomingApiKey || incomingApiKey !== expectedKey) {
    console.warn(`[Security] Blocked unauthorized webhook attempt from IP ${req.ip}`);
    return res.status(403).json({ error: 'Forbidden: Invalid webhook secret' });
  }

  next();
};

module.exports = verifyWebhookContext;
