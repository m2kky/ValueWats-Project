const express = require('express');
const router = express.Router();
const integrationService = require('../services/integration.service');
const { createSallaOAuthService } = require('../stores/providers/salla/sallaOAuthService');

router.get('/salla/callback', async (req, res) => {
  try {
    if (req.query.error) throw Object.assign(new Error('denied'), { code: 'SALLA_OAUTH_DENIED' });
    const dependencies = req.app.locals.dependencies || {};
    const sallaOAuthService = dependencies.sallaOAuthService || createSallaOAuthService({
      prisma: dependencies.prisma || require('../config/database'), queue: dependencies.queues?.storeSync, clock: dependencies.clock
    });
    await sallaOAuthService.completeCallback({ code: req.query.code, state: req.query.state });
    res.redirect('/settings/integrations?success=true');
  } catch (error) {
    const code = /^SALLA_[A-Z0-9_]+$|^STORE_INTEGRATION_NOT_FOUND$/.test(error?.code || '') ? error.code : 'SALLA_OAUTH_FAILED';
    console.info('store.salla.oauth', { operation: 'oauth_callback_redirect', outcome: 'error', errorCode: code });
    res.redirect(`/settings/integrations?error=${encodeURIComponent(code)}`);
  }
});

router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/integrations?error=${encodeURIComponent(error)}`);
  }
  
  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const integrationId = state;
    await integrationService.completeOAuth(integrationId, code);
    
    // Redirect back to frontend integrations page exactly as requested
    res.redirect(`/integrations?success=true`);
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    res.redirect(`/integrations?error=${encodeURIComponent(err.message)}`);
  }
});


router.get('/notion/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/integrations?error=${encodeURIComponent(error)}`);
  }
  
  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const integrationId = state;
    await integrationService.completeNotionOAuth(integrationId, code);
    res.redirect(`/integrations?success=true`);
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    res.redirect(`/integrations?error=${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
