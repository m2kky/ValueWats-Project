const crypto = require('node:crypto');
const {
  encryptStoreCredentials,
  decryptStoreCredentials,
  assertStoreCredentialEncryptionConfigured
} = require('../../storeCredentialCrypto');

const PAIRING_TTL_MS = 30 * 60 * 1000;
const AUTHORIZATION_TTL_MS = 24 * 60 * 60 * 1000;
const INSTALLATION_STATUSES = ['pending', 'active', 'error', 'revoked', 'reauthorization_required'];
const RECOVERABLE_STATUSES = ['active', 'error', 'reauthorization_required'];

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

function authorizationEventDate(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const input = value.trim();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)
    ? `${input.replace(' ', 'T')}Z`
    : input;
  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : fallback;
}

function authorizationCredentials(data, now, eventCreatedAt) {
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
  return {
    credentials,
    encrypted: encryptStoreCredentials(credentials),
    scope: data.scope,
    eventCreatedAt: authorizationEventDate(eventCreatedAt, new Date(credentials.expiresAt)).toISOString()
  };
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

function credentialExpiry(encrypted) {
  try {
    const expiresAt = new Date(decryptStoreCredentials(encrypted).expiresAt);
    return Number.isFinite(expiresAt.getTime()) ? expiresAt : null;
  } catch (_) {
    return null;
  }
}

function authorizationIsStale({ currentEventAt, currentExpiresAt, nextEventAt, nextExpiresAt }) {
  const currentEvent = new Date(currentEventAt);
  const nextEvent = new Date(nextEventAt);
  if (Number.isFinite(currentEvent.getTime()) && Number.isFinite(nextEvent.getTime()) &&
      currentEvent.getTime() !== nextEvent.getTime()) {
    return currentEvent > nextEvent;
  }
  return currentExpiresAt && currentExpiresAt.getTime() >= new Date(nextExpiresAt).getTime();
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
    const nextMetadata = { ...metadata(integration.metadata), ...pairing.metadata };
    delete nextMetadata.pendingMerchantId;
    const saved = await prisma.integration.updateMany({
      where: { id: integration.id, tenantId, type: 'store_salla', status: integration.status },
      data: {
        status: integration.status === 'active' ? 'active' : 'pending',
        metadata: nextMetadata
      }
    });
    if (saved.count !== 1) throw codedError('STORE_INTEGRATION_NOT_FOUND');
    await prisma.sallaPendingPairing.deleteMany({ where: { integrationId: integration.id } });
    return connectionResult(integration.id, pairing.pairingCode, configuredAppId);
  }

  async function withMerchantLock(merchantId, operation) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `salla-easy:${merchantId}`);
      return operation(tx);
    }, { maxWait: 5000, timeout: 10000 });
  }

  async function enqueueRequiredSync({ integrationId, tenantId, eventCreatedAt, metadata: currentMetadata, outcome }) {
    try {
      await queue.enqueueFullSync({ tenantId, integrationId });
    } catch (_) {
      await prisma.integration.updateMany({
        where: {
          id: integrationId,
          tenantId,
          type: 'store_salla',
          status: 'active',
          metadata: { path: ['authorizationEventAt'], equals: eventCreatedAt }
        },
        data: { status: 'error', metadata: { ...currentMetadata, syncRequired: true } }
      });
      throw codedError('SALLA_INITIAL_SYNC_FAILED');
    }

    const syncedMetadata = { ...currentMetadata };
    delete syncedMetadata.syncRequired;
    await prisma.integration.updateMany({
      where: {
        id: integrationId,
        tenantId,
        type: 'store_salla',
        status: 'active',
        metadata: { path: ['authorizationEventAt'], equals: eventCreatedAt }
      },
      data: { status: 'active', metadata: syncedMetadata }
    });
    return { outcome, activated: true, integrationId };
  }

  async function tryFinalize(merchantId) {
    const activation = await withMerchantLock(merchantId, async (tx) => {
      const pairing = await tx.sallaPendingPairing.findUnique({ where: { merchantId } });
      if (!pairing || pairing.expiresAt <= clock()) return null;
      const pending = await tx.sallaPendingAuthorization.findUnique({ where: { merchantId } });
      if (!pending || pending.expiresAt <= clock()) return null;
      const integration = await tx.integration.findFirst({
        where: {
          id: pairing.integrationId,
          tenantId: pairing.tenantId,
          type: 'store_salla',
          status: 'pending'
        }
      });
      if (!integration) return null;
      await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `salla:${integration.id}`);
      const tokenExpiresAt = credentialExpiry(pending.credentials);
      if (!tokenExpiresAt) throw codedError('SALLA_INVALID_AUTHORIZATION_EVENT');
      const activationMetadata = {
        installationMode: 'easy',
        authorizationExpiresAt: tokenExpiresAt.toISOString(),
        authorizationEventAt: (pending.eventCreatedAt || tokenExpiresAt).toISOString(),
        syncRequired: true
      };
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
          metadata: activationMetadata
        }
      });
      if (activated.count !== 1) return null;
      await tx.sallaPendingAuthorization.deleteMany({ where: { merchantId } });
      await tx.sallaPendingPairing.deleteMany({ where: { merchantId } });
      return {
        integrationId: integration.id,
        tenantId: integration.tenantId,
        eventCreatedAt: activationMetadata.authorizationEventAt,
        metadata: activationMetadata,
        outcome: 'activated'
      };
    });
    if (!activation) return { outcome: 'staged', activated: false };
    return enqueueRequiredSync(activation);
  }

  async function handleAuthorization({ merchantId: rawMerchantId, data, eventCreatedAt }) {
    ensureEncryption();
    const merchantId = merchantIdentifier(rawMerchantId);
    const issued = authorizationCredentials(data, clock(), eventCreatedAt);
    const eventExpiresAt = issued.credentials.expiresAt;
    const result = await withMerchantLock(merchantId, async (tx) => {
      const owner = await tx.integration.findFirst({
        where: { type: 'store_salla', externalAccountId: merchantId, status: { in: RECOVERABLE_STATUSES } }
      });
      if (owner) {
        await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `salla:${owner.id}`);
        const current = await tx.integration.findFirst({
          where: {
            id: owner.id,
            tenantId: owner.tenantId,
            type: 'store_salla',
            externalAccountId: merchantId,
            status: { in: RECOVERABLE_STATUSES }
          }
        });
        if (!current) return { outcome: 'duplicate', activated: false, integrationId: owner.id };
        const currentMetadata = metadata(current.metadata);
        if (sameCredentials(current.credentials, issued.credentials)) {
          if (!currentMetadata.syncRequired) {
            return { outcome: 'duplicate', activated: false, integrationId: current.id };
          }
          const recoveryMetadata = {
            ...currentMetadata,
            installationMode: 'easy',
            authorizationExpiresAt: eventExpiresAt,
            authorizationEventAt: issued.eventCreatedAt,
            syncRequired: true
          };
          await tx.integration.updateMany({
            where: { id: current.id, tenantId: current.tenantId, type: 'store_salla', status: { in: RECOVERABLE_STATUSES } },
            data: { status: 'active', metadata: recoveryMetadata }
          });
          return {
            needsSync: true,
            integrationId: current.id,
            tenantId: current.tenantId,
            eventCreatedAt: issued.eventCreatedAt,
            metadata: recoveryMetadata,
            outcome: 'recovered'
          };
        }
        const currentExpiry = credentialExpiry(current.credentials);
        if (authorizationIsStale({
          currentEventAt: currentMetadata.authorizationEventAt,
          currentExpiresAt: currentExpiry,
          nextEventAt: issued.eventCreatedAt,
          nextExpiresAt: eventExpiresAt
        })) {
          return { outcome: 'stale', activated: false, integrationId: current.id };
        }
        const rotationMetadata = {
          ...currentMetadata,
          installationMode: 'easy',
          authorizationExpiresAt: eventExpiresAt,
          authorizationEventAt: issued.eventCreatedAt,
          syncRequired: true
        };
        const saved = await tx.integration.updateMany({
          where: { id: current.id, tenantId: current.tenantId, type: 'store_salla', status: { in: RECOVERABLE_STATUSES } },
          data: { status: 'active', credentials: issued.encrypted, metadata: rotationMetadata }
        });
        if (saved.count !== 1) return { outcome: 'duplicate', activated: false, integrationId: current.id };
        return {
          needsSync: true,
          integrationId: current.id,
          tenantId: current.tenantId,
          eventCreatedAt: issued.eventCreatedAt,
          metadata: rotationMetadata,
          outcome: 'rotated'
        };
      }

      const existing = await tx.sallaPendingAuthorization.findUnique({ where: { merchantId } });
      const existingExpiry = existing ? credentialExpiry(existing.credentials) : null;
      if (existing && authorizationIsStale({
        currentEventAt: existing.eventCreatedAt,
        currentExpiresAt: existingExpiry,
        nextEventAt: issued.eventCreatedAt,
        nextExpiresAt: eventExpiresAt
      })) {
        return { outcome: 'staged', activated: false };
      }
      await tx.sallaPendingAuthorization.upsert({
        where: { merchantId },
        create: {
          merchantId,
          credentials: issued.encrypted,
          scope: issued.scope,
          eventCreatedAt: new Date(issued.eventCreatedAt),
          expiresAt: new Date(clock().getTime() + AUTHORIZATION_TTL_MS)
        },
        update: {
          credentials: issued.encrypted,
          scope: issued.scope,
          eventCreatedAt: new Date(issued.eventCreatedAt),
          expiresAt: new Date(clock().getTime() + AUTHORIZATION_TTL_MS)
        }
      });
      return { outcome: 'staged', activated: false, finalize: true };
    });
    if (result.needsSync) return enqueueRequiredSync(result);
    if (!result.finalize) return result;
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
    const nextMetadata = { ...currentMetadata, installationMode: 'easy', pendingMerchantId: merchantId };
    delete nextMetadata.pairingCodeHash;
    delete nextMetadata.pairingExpiresAt;
    try {
      const claimed = await withMerchantLock(merchantId, async (tx) => {
        const owner = await tx.integration.findFirst({
          where: { type: 'store_salla', externalAccountId: merchantId, NOT: { id: integration.id } }
        });
        if (owner) return false;
        const merchantClaim = await tx.sallaPendingPairing.findUnique({ where: { merchantId } });
        if (merchantClaim && merchantClaim.integrationId !== integration.id) return false;
        const integrationClaim = await tx.sallaPendingPairing.findUnique({ where: { integrationId: integration.id } });
        if (integrationClaim && integrationClaim.merchantId !== merchantId) return false;
        if (!merchantClaim) {
          await tx.sallaPendingPairing.create({
            data: {
              merchantId,
              integrationId: integration.id,
              tenantId: integration.tenantId,
              expiresAt: new Date(clock().getTime() + AUTHORIZATION_TTL_MS)
            }
          });
        }
        const saved = await tx.integration.updateMany({
          where: {
            id: integration.id,
            tenantId: integration.tenantId,
            type: 'store_salla',
            status: integration.status,
            metadata: { path: ['pairingCodeHash'], equals: hashCode(pairingCode) }
          },
          data: { status: 'pending', metadata: nextMetadata }
        });
        if (saved.count !== 1) throw codedError('SALLA_PAIRING_RACE');
        return true;
      });
      if (!claimed) return { outcome: 'ignored', activated: false };
    } catch (error) {
      if (error?.code === 'P2002' || error?.code === 'SALLA_PAIRING_RACE') {
        return { outcome: 'ignored', activated: false };
      }
      throw error;
    }
    return tryFinalize(merchantId);
  }

  async function handleUninstalled({ merchantId: rawMerchantId }) {
    ensureEncryption();
    const merchantId = merchantIdentifier(rawMerchantId);
    return withMerchantLock(merchantId, async (tx) => {
      const owner = await tx.integration.findFirst({
        where: { type: 'store_salla', externalAccountId: merchantId }
      });
      const pairing = await tx.sallaPendingPairing.findUnique({ where: { merchantId } });
      const target = owner || (pairing
        ? await tx.integration.findFirst({
            where: { id: pairing.integrationId, tenantId: pairing.tenantId, type: 'store_salla' }
          })
        : null);
      let revoked = { count: 0 };
      if (target) {
        await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `salla:${target.id}`);
        revoked = await tx.integration.updateMany({
          where: { id: target.id, tenantId: target.tenantId, type: 'store_salla' },
          data: { status: 'revoked', metadata: { installationMode: 'easy' } }
        });
      }
      await tx.sallaPendingAuthorization.deleteMany({ where: { merchantId } });
      await tx.sallaPendingPairing.deleteMany({ where: { merchantId } });
      return { outcome: revoked.count ? 'revoked' : 'ignored' };
    });
  }

  async function reconcilePending() {
    const cutoff = clock();
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
        const values = metadata(integration.metadata);
        if (!values.pairingCodeHash) return false;
        const expiresAt = new Date(values.pairingExpiresAt);
        return !Number.isFinite(expiresAt.getTime()) || expiresAt <= cutoff;
      })
      .map((integration) => integration.id);
    const integrations = expiredIds.length
      ? await prisma.integration.deleteMany({
          where: { id: { in: expiredIds }, type: 'store_salla', status: 'pending' }
        })
      : { count: 0 };
    const expiredPairings = await prisma.sallaPendingPairing.findMany({
      where: { expiresAt: { lt: cutoff } },
      select: { merchantId: true, integrationId: true, expiresAt: true }
    });
    let deletedPairings = { count: 0 };
    let deletedClaimIntegrations = { count: 0 };
    for (const pairing of expiredPairings) {
      const removed = await withMerchantLock(pairing.merchantId, async (tx) => {
        const pairingResult = await tx.sallaPendingPairing.deleteMany({
          where: {
            merchantId: pairing.merchantId,
            integrationId: pairing.integrationId,
            expiresAt: pairing.expiresAt
          }
        });
        if (pairingResult.count !== 1) return { pairings: 0, integrations: 0 };
        const integrationResult = await tx.integration.deleteMany({
          where: { id: pairing.integrationId, type: 'store_salla', status: 'pending' }
        });
        return { pairings: pairingResult.count, integrations: integrationResult.count };
      });
      deletedPairings.count += removed.pairings;
      deletedClaimIntegrations.count += removed.integrations;
    }
    const authorizations = await prisma.sallaPendingAuthorization.deleteMany({
      where: { expiresAt: { lt: cutoff } }
    });
    return {
      integrations: integrations.count + deletedClaimIntegrations.count,
      authorizations: authorizations.count,
      pairings: deletedPairings.count
    };
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
