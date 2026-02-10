const express = require('express');
const router = express.Router();
const linkShortener = require('../services/linkShortener');

// GET /l/:code - Handle redirection
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Retrieve original URL
    const link = await linkShortener.getOriginalUrl(code);

    if (!link) {
      return res.status(404).send('Link not found or expired');
    }

    // Log tracking event (async, don't block response)
    linkShortener.logClick(code, ip, userAgent).catch(err => console.error('Click logging error:', err));

    // Redirect
    res.redirect(link.originalUrl);

  } catch (error) {
    console.error('Redirection Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
