const crypto = require('node:crypto');
const {
  encryptStoreCredentials,
  decryptStoreCredentials,
  assertStoreCredentialEncryptionConfigured
} = require('../../storeCredentialCrypto');

const PAIRING_TTL_MS = 30 * 60 * 1000;
const AUTHORIZATION_TTL_MS = 24 * 60 * 60 * 1000;
const INSTALLATION_STATUSES = ['pending', 'active', 'error', 'revoked', 'reauthorization_required'];

function codedError(code) {
  return Object.assign(new Error(code), { code });
}

function metadata(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function hashCode(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function grantedScopes(value) {
  return new Set(typeof value === 'string' ? value.split(/[\s,]+/).filter(Boolean) : []);
}

function authorizationCredentials(data, now) {
  const scopes = grantedScopes(data?.scope);
  if (!scopes.has('offline_access') ||
      (!scopes.has('products.read') && !scopes.has('products.read_write'))) {
    throw codedError('SALLA_REQUIRED_SCOPE_MISSING');
  }
  const expires = Number(data?.expires);
  if (typeof data?.access_token !== 'string' || !data.access_token ||
      typeof data?.refresh_token !== 'string' || !data.refresh_token ||
      !Number.isFinite(expires) || expires * 1000 <= now.getTime()) {
    throw codedError('SALLA_INVALID_AUTHORIZATION_EVENT');
  }
  const credentials = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(expires * 1000).toISOString()
  };
  return { credentials, encrypted: encryptStoreCredentials(credentials), scope: data.scope };
}

function sameCredentials(encrypted, expected) {
  try {
    const current = decryptStoreCredentials(encrypted);
    return current.accessToken === expected.accessToken &&
      current.refreshToken === expected.refreshToken &&
      current.expiresAt === expected.expiresAt;
  } catch (_) {
    return false;
  }
}

function merchantIdentifier(value) {
  if (!['string', 'number'].includes(typeof value)) throw codedError('SALLA_INVALID_AUTHORIZATION_EVENT');
  const merchantId = String(value).trim();
  if (!merchantId || merchantId.length > 128) throw codedError('SALLA_INVALID_AUTHORIZATION_EVENT');
  return merchantId;
}

function createSallaEasyModeService({
  prisma,
  queue,
  clock = () => new Date(),
  randomBytes = crypto.randomBytes,
  appId = process.env.SALLA_APP_ID
} = {}) {
  function ensureEncryption() {
    try {
      assertStoreCredentialEncryptionConfigured();
    } catch (_) {
      throw codedError('SALLA_EASY_MODE_NOT_CONFIGURED');
    }
  }

  function ensureConnectionConfigured() {
    ensureEncryption();
    if (typeof appId !== 'string' || !/^\d+$/.test(appId.trim())) {
      throw codedError('SALLA_EASY_MODE_NOT_CONFIGURED');
    }
    return appId.trim();
  }

  function newPairing() {
    const pairingCode = randomBytes(24).toString('base64url');
    return {
      pairingCode,
      metadata: {
        installationMode: 'easy',
        pairingCodeHash: hashCode(pairingCode),
        pairingExpiresAt: new Date(clock().getTime() + PAIRING_TTL_MS).toISOString()
      }
    };
  }

  function connectionResult(integrationId, pairingCode, configuredAppId) {
    return {
      mode: 'easy',
      integrationId,
      pairingCode,
      installUrl: `https://s.salla.sa/apps/install/${configuredAppId}`
    };
  }

  async function createConnection({ tenantId }) {
    const configuredAppId = ensureConnectionConfigured();
    const pairing = newPairing();
    const integration = await prisma.integration.create({
      data: {
        tenantId,
        type: 'store_salla',
        name: 'Salla Store',
        status: 'pending',
        credentials: encryptStoreCredentials({ provider: 'salla', pending: true }),
        metadata: pairing.metadata
      }
    });
    return connectionResult(integration.id, pairing.pairingCode, configuredAppId);
  }

  async function reconnect({ tenantId, integrationId }) {
    const configuredAppId = ensureConnectionConfigured();
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        tenantId,
        type: 'store_salla',
        status: { in: INSTALLATION_STATUSES }
      }
    });
    if (!integration) throw codedError('STORE_INTEGRATION_NOT_FOUND');
    const pairing = newPairing();
    const saved = await prisma.integration.updateMany({
      where: { id: integration.id, tenantId, type: 'store_salla', status: integration.status },
      data: {
        status: integration.status === 'active' ? 'active' : 'pending',
        metadata: { ...metadata(integration.metadata), ...pairing.metadata }
      }
    });
    if (saved.count !== 1) throw codedError('STORE_INTEGRATION_NOT_FOUND');
    return connectionResult(integration.id, pairing.pairingCode, configuredAppId);
  }

  async function tryFinalize(merchantId) {
    const integration = await prisma.integration.findFirst({
      where: {
        type: 'store_salla',
        status: 'pending',
        metadata: { path: ['pendingMerchantId'], equals: merchantId }
      }
    });
    if (!integration) return { outcome: 'staged', activated: false };
    const pending = await prisma.sallaPendingAuthorization.findUnique({ where: { merchantId } });
    if (!pending || pending.expiresAt <= clock()) return { outcome: 'staged', activated: false };

    const result = await prisma.$transaction(async (tx) => {
      const activated = await tx.integration.updateMany({
        where: {
          id: integration.id,
          tenantId: integration.tenantId,
          type: 'store_salla',
          status: 'pending'
        },
        data: {
          status: 'active',
          externalAccountId: merchantId,
          credentials: pending.credentials,
          metadata: { installationMode: 'easy' }
        }
      });
      if (activated.count !== 1) return false;
      await tx.sallaPendingAuthorization.deleteMany({ where: { merchantId } });
      return true;
    });
    if (!result) return { outcome: 'duplicate', activated: false };
    try {
      await queue.enqueueFullSync({ tenantId: integration.tenantId, integrationId: integration.id });
    } catch (_) {
      await prisma.integration.updateMany({
        where: { id: integration.id, tenantId: integration.tenantId, type: 'store_salla', status: 'active' },
        data: { status: 'error' }
      });
      throw codedError('SALLA_INITIAL_SYNC_FAILED');
    }
    return { outcome: 'activated', activated: true, integrationId: integration.id };
  }

  async function handleAuthorization({ merchantId: rawMerchantId, data }) {
    ensureEncryption();
    const merchantId = merchantIdentifier(rawMerchantId);
    const issued = authorizationCredentials(data, clock());
    const active = await prisma.integration.findFirst({
      where: { type: 'store_salla', externalAccountId: merchantId, status: 'active' }
    });
    if (active) {
      if (sameCredentials(active.credentials, issued.credentials)) {
        return { outcome: 'duplicate', activated: false, integrationId: active.id };
      }
      const saved = await prisma.integration.updateMany({
        where: { id: active.id, tenantId: active.tenantId, type: 'store_salla', status: 'active' },
        data: { credentials: issued.encrypted, metadata: { ...metadata(active.metadata), installationMode: 'easy' } }
      });
      if (saved.count !== 1) return { outcome: 'duplicate', activated: false, integrationId: active.id };
      await queue.enqueueFullSync({ tenantId: active.tenantId, integrationId: active.id });
      return { outcome: 'rotated', activated: true, integrationId: active.id };
    }

    await prisma.sallaPendingAuthorization.upsert({
      where: { merchantId },
      create: {
        merchantId,
        credentials: issued.encrypted,
        scope: issued.scope,
        expiresAt: new Date(clock().getTime() + AUTHORIZATION_TTL_MS)
      },
      update: {
        credentials: issued.encrypted,
        scope: issued.scope,
        expiresAt: new Date(clock().getTime() + AUTHORIZATION_TTL_MS)
      }
    });
    return tryFinalize(merchantId);
  }

  async function handleSettingsUpdated({ merchantId: rawMerchantId, settings }) {
    ensureEncryption();
    const merchantId = merchantIdentifier(rawMerchantId);
    const pairingCode = settings?.valuechat_connection_code;
    if (typeof pairingCode !== 'string' || pairingCode.length < 8 || pairingCode.length > 128) {
      return { outcome: 'ignored', activated: false };
    }
    const integration = await prisma.integration.findFirst({
      where: {
        type: 'store_salla',
        status: { in: INSTALLATION_STATUSES },
        metadata: { path: ['pairingCodeHash'], equals: hashCode(pairingCode) }
      }
    });
    if (!integration) return { outcome: 'ignored', activated: false };
    const pairingExpiresAt = new Date(metadata(integration.metadata).pairingExpiresAt);
    if (!Number.isFinite(pairingExpiresAt.getTime()) || pairingExpiresAt <= clock()) {
      return { outcome: 'ignored', activated: false };
    }
    const owner = await prisma.integration.findFirst({
      where: { type: 'store_salla', externalAccountId: merchantId, NOT: { id: integration.id } }
    });
    if (owner) return { outcome: 'ignored', activated: false };
    if (integration.status === 'active') {
      if (integration.externalAccountId !== merchantId) return { outcome: 'ignored', activated: false };
      const nextMetadata = { ...metadata(integration.metadata), installationMode: 'easy' };
      delete nextMetadata.pairingCodeHash;
      delete nextMetadata.pairingExpiresAt;
      await prisma.integration.updateMany({
        where: { id: integration.id, tenantId: integration.tenantId, type: 'store_salla', status: 'active' },
        data: { metadata: nextMetadata }
      });
      return { outcome: 'duplicate', activated: false, integrationId: integration.id };
    }

    const currentMetadata = metadata(integration.metadata);
    if (currentMetadata.pendingMerchantId && currentMetadata.pendingMerchantId !== merchantId) {
      return { outcome: 'ignored', activated: false };
    }
    const nextMetadata = { ...currentMetadata, installationMode: 'easy', pendingMerchantId: merchantId };
    delete nextMetadata.pairingCodeHash;
    const saved = await prisma.integration.updateMany({
      where: {
        id: integration.id,
        tenantId: integration.tenantId,
        type: 'store_salla',
        status: integration.status
      },
      data: { status: 'pending', metadata: nextMetadata }
    });
    if (saved.count !== 1) return { outcome: 'ignored', activated: false };
    return tryFinalize(merchantId);
  }

  async function handleUninstalled({ merchantId: rawMerchantId }) {
    ensureEncryption();
    const merchantId = merchantIdentifier(rawMerchantId);
    const revoked = await prisma.integration.updateMany({
      where: { type: 'store_salla', externalAccountId: merchantId },
      data: { status: 'revoked' }
    });
    const pendingIntegration = await prisma.integration.findFirst({
      where: {
        type: 'store_salla',
        status: 'pending',
        metadata: { path: ['pendingMerchantId'], equals: merchantId }
      }
    });
    if (pendingIntegration) {
      await prisma.integration.updateMany({
        where: { id: pendingIntegration.id, tenantId: pendingIntegration.tenantId, type: 'store_salla', status: 'pending' },
        data: { status: 'revoked', metadata: { installationMode: 'easy' } }
      });
    }
    await prisma.sallaPendingAuthorization.deleteMany({ where: { merchantId } });
    return { outcome: revoked.count || pendingIntegration ? 'revoked' : 'ignored' };
  }

  async function reconcilePending() {
    const pendingIntegrations = await prisma.integration.findMany({
      where: {
        type: 'store_salla',
        status: 'pending',
        metadata: { path: ['installationMode'], equals: 'easy' }
      },
      select: { id: true, metadata: true }
    });
    const expiredIds = pendingIntegrations
      .filter((integration) => {
        const expiresAt = new Date(metadata(integration.metadata).pairingExpiresAt);
        return !Number.isFinite(expiresAt.getTime()) || expiresAt <= clock();
      })
      .map((integration) => integration.id);
    const integrations = expiredIds.length
      ? await prisma.integration.deleteMany({
          where: { id: { in: expiredIds }, type: 'store_salla', status: 'pending' }
        })
      : { count: 0 };
    const authorizations = await prisma.sallaPendingAuthorization.deleteMany({
      where: { expiresAt: { lt: clock() } }
    });
    return { integrations: integrations.count, authorizations: authorizations.count };
  }

  return {
    createConnection,
    reconnect,
    handleAuthorization,
    handleSettingsUpdated,
    handleUninstalled,
    reconcilePending
  };
}

module.exports = { createSallaEasyModeService };
