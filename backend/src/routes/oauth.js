const express = require('express');
const router = express.Router();
const integrationService = require('../services/integration.service');

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
    await integrationService.completeOAuth(integrationId, code);
    res.redirect(`/integrations?success=true`);
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    res.redirect(`/integrations?error=${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
