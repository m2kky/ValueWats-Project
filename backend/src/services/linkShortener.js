const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { nanoid } = require('nanoid');

// Generate a short URL for a specific campaign and/or message
const generateShortUrl = async (originalUrl, campaignId, messageId = null) => {
  // Check if link already exists for this exact combination to avoid duplicates
  // Note: For per-user tracking (messageId), we almost always create a new one.
  // For per-campaign, we might reuse.
  
  // Implementation: Always create new for now to simplify logic, or check uniqueness.
  // Using nanoid(8) for sufficient entropy.
  const shortCode = nanoid(8);

  const link = await prisma.link.create({
    data: {
      originalUrl,
      shortCode,
      campaignId,
      messageId
    }
  });

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  return `${backendUrl}/l/${shortCode}`;
};

const getOriginalUrl = async (shortCode) => {
  const link = await prisma.link.findUnique({
    where: { shortCode }
  });

  if (!link) return null;

  // Increment clicks (fire and forget update or await if critical)
  // We'll await to ensure consistency for now
  await prisma.link.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } }
  });

  return link;
};

const logClick = async (shortCode, ip, userAgent) => {
    const link = await prisma.link.findUnique({ where: { shortCode } });
    if (!link) return;

    // Detect device type simple check
    let device = 'desktop';
    if (/mobile/i.test(userAgent)) device = 'mobile';
    else if (/tablet/i.test(userAgent)) device = 'tablet';

    await prisma.clickEvent.create({
        data: {
            linkId: link.id,
            ipAddress: ip,
            userAgent: userAgent,
            device
        }
    });
};

module.exports = {
  generateShortUrl,
  getOriginalUrl,
  logClick
};
