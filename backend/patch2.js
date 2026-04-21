const fs = require('fs');
let code = fs.readFileSync('src/routes/integrations.js', 'utf8');

const routeStr = `
router.post('/google/auth-url', async (req, res) => {
  try {
    const { name, clientId, clientSecret, redirectUri } = req.body;
    if (!clientId || !clientSecret || !redirectUri) {
       return res.status(400).json({ error: 'Missing OAuth parameters' });
    }
    const result = await integrationService.createOAuthPending(
      req.user.tenantId,
      name || 'Google Connection',
      clientId,
      clientSecret,
      redirectUri
    );
    res.json(result); // { authUrl }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- WORKFLOWS ---`;

code = code.replace('// --- WORKFLOWS ---', routeStr);
fs.writeFileSync('src/routes/integrations.js', code);
console.log('Appended auth-url route');
