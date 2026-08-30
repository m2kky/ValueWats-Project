const axios = require('axios');
const dns = require('node:dns').promises;
const https = require('node:https');
const net = require('node:net');
const { encryptStoreCredentials } = require('../../storeCredentialCrypto');

function typedError(code) {
  return Object.assign(new Error(code), { code });
}

function privateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168);
  }
  const normalized = address.toLowerCase();
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
    normalized.startsWith('fea') || normalized.startsWith('feb');
}

function normalizedUrl(value) {
  let url;
  try {
    url = new URL(String(value || '').trim());
  } catch (_) {
    throw typedError('SALLA_PUBLIC_STORE_URL_INVALID');
  }
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) {
    throw typedError('SALLA_PUBLIC_STORE_URL_INVALID');
  }
  return `${url.origin}/`;
}

function storeIdentifier(html) {
  const patterns = [
    /\/theme\/(\d{6,})\//i,
    /["']store[_-]?id["']\s*[:=]\s*["']?(\d{6,})/i,
    /store-identifier["']?\s*(?:content=|[:=])\s*["'](\d{6,})/i
  ];
  return patterns.map((pattern) => String(html).match(pattern)?.[1]).find(Boolean) || null;
}

function categoryIds(html) {
  const ids = new Set();
  for (const match of String(html).matchAll(/source-value=["']\[([^\]]+)\]["']/gi)) {
    for (const id of match[1].match(/\d+/g) || []) ids.add(id);
  }
  return [...ids];
}

function createSallaPublicService({
  prisma, queue, http = axios,
  resolveHostname = (hostname) => dns.lookup(hostname, { all: true })
} = {}) {
  return {
    async connect({ tenantId, name, storeUrl }) {
      const normalizedStoreUrl = normalizedUrl(storeUrl);
      const hostname = new URL(normalizedStoreUrl).hostname;
      let addresses;
      try {
        addresses = net.isIP(hostname)
          ? [{ address: hostname, family: net.isIPv4(hostname) ? 4 : 6 }]
          : await resolveHostname(hostname);
      } catch (_) {
        throw typedError('SALLA_PUBLIC_STORE_UNREACHABLE');
      }
      if (!addresses.length || addresses.some(({ address }) => privateAddress(address))) {
        throw typedError('SALLA_PUBLIC_STORE_URL_INVALID');
      }

      const pinned = addresses[0];
      let response;
      try {
        response = await http.get(normalizedStoreUrl, {
          timeout: 5000,
          maxRedirects: 0,
          responseType: 'text',
          headers: { 'User-Agent': 'ValueChat Store Connector/1.0' },
          httpsAgent: new https.Agent({
            lookup: (_hostname, options, callback) => options?.all
              ? callback(null, [pinned])
              : callback(null, pinned.address, pinned.family)
          })
        });
      } catch (_) {
        throw typedError('SALLA_PUBLIC_STORE_UNREACHABLE');
      }

      const identifier = storeIdentifier(response.data);
      const categories = categoryIds(response.data);
      if (!identifier || !categories.length) throw typedError('SALLA_PUBLIC_STORE_NOT_DETECTED');

      const integration = await prisma.integration.create({
        data: {
          tenantId,
          type: 'store_salla',
          name: String(name || '').trim() || 'Salla Store',
          status: 'active',
          externalAccountId: `public:${tenantId}:${identifier}`,
          credentials: encryptStoreCredentials({
            provider: 'salla_public',
            storeUrl: normalizedStoreUrl,
            storeIdentifier: identifier,
            categoryIds: categories
          }),
          metadata: {
            accessMode: 'public_storefront',
            storeUrl: normalizedStoreUrl,
            categoryCount: categories.length,
            lastSyncedAt: null
          }
        }
      });
      await queue.enqueueFullSync({ tenantId, integrationId: integration.id });
      return {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        status: integration.status,
        metadata: integration.metadata
      };
    }
  };
}

module.exports = { createSallaPublicService };
