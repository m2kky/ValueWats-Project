const crypto = require('node:crypto');
const { decryptStoreCredentials, encryptStoreCredentials } = require('../../../src/stores/storeCredentialCrypto');
const { createSallaEasyModeService } = require('../../../src/stores/providers/salla/sallaEasyModeService');

const encryptionKey = crypto.randomBytes(32).toString('base64');
const now = new Date('2026-08-27T10:00:00.000Z');
const authorizationData = {
  access_token: 'access-secret',
  refresh_token: 'refresh-secret',
  expires: Math.floor(new Date('2026-08-28T10:00:00.000Z').getTime() / 1000),
  scope: 'products.read offline_access'
};

function matchesStatus(value, condition) {
  if (typeof condition === 'string') return value === condition;
  if (condition?.in) return condition.in.includes(value);
  return true;
}

function createHarness({ integrationOverrides = {}, appId = '946600964', clock = () => now } = {}) {
  const integrations = [{
    id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', name: 'Salla Store',
    status: 'pending', credentials: 'pending', externalAccountId: null, metadata: null,
    updatedAt: now, ...integrationOverrides
  }];
  const pending = new Map();
  const pairings = new Map();

  function findIntegration(where = {}) {
    return integrations.find((item) => {
      if (where.id && item.id !== where.id) return false;
      if (where.tenantId && item.tenantId !== where.tenantId) return false;
      if (where.type && item.type !== where.type) return false;
      if (where.externalAccountId !== undefined && item.externalAccountId !== where.externalAccountId) return false;
      if (!matchesStatus(item.status, where.status)) return false;
      if (where.NOT?.id && item.id === where.NOT.id) return false;
      if (where.metadata?.path) {
        const value = where.metadata.path.reduce((current, key) => current?.[key], item.metadata);
        if (value !== where.metadata.equals) return false;
      }
      return true;
    }) || null;
  }

  const prisma = {
    integration: {
      create: vi.fn(async ({ data }) => {
        const item = { id: `integration-${integrations.length + 1}`, externalAccountId: null, ...data, updatedAt: now };
        integrations.push(item);
        return item;
      }),
      findFirst: vi.fn(async ({ where }) => findIntegration(where)),
      findMany: vi.fn(async ({ where }) => integrations.filter((item) => {
        if (where.type && item.type !== where.type) return false;
        if (!matchesStatus(item.status, where.status)) return false;
        if (where.metadata?.path) {
          const value = where.metadata.path.reduce((current, key) => current?.[key], item.metadata);
          return value === where.metadata.equals;
        }
        return true;
      }).map(({ id, metadata }) => ({ id, metadata }))),
      updateMany: vi.fn(async ({ where, data }) => {
        const item = findIntegration(where);
        if (!item) return { count: 0 };
        Object.assign(item, data, { updatedAt: now });
        return { count: 1 };
      }),
      deleteMany: vi.fn(async ({ where }) => {
        const ids = where.id?.in || (where.id ? [where.id] : []);
        const before = integrations.length;
        for (let index = integrations.length - 1; index >= 0; index -= 1) {
          if (ids.includes(integrations[index].id) && matchesStatus(integrations[index].status, where.status)) {
            integrations.splice(index, 1);
          }
        }
        return { count: before - integrations.length };
      })
    },
    sallaPendingAuthorization: {
      upsert: vi.fn(async ({ where, create, update }) => {
        const value = pending.has(where.merchantId) ? { ...pending.get(where.merchantId), ...update } : create;
        pending.set(where.merchantId, value);
        return value;
      }),
      findUnique: vi.fn(async ({ where }) => pending.get(where.merchantId) || null),
      deleteMany: vi.fn(async ({ where }) => {
        if (where.merchantId) return { count: pending.delete(where.merchantId) ? 1 : 0 };
        let count = 0;
        for (const [merchantId, value] of pending.entries()) {
          if (where.expiresAt?.lt && value.expiresAt < where.expiresAt.lt) {
            pending.delete(merchantId);
            count += 1;
          }
        }
        return { count };
      })
    },
    sallaPendingPairing: {
      create: vi.fn(async ({ data }) => {
        if (pairings.has(data.merchantId) || [...pairings.values()].some((item) => item.integrationId === data.integrationId)) {
          throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        }
        pairings.set(data.merchantId, data);
        return data;
      }),
      findUnique: vi.fn(async ({ where }) => {
        if (where.merchantId) return pairings.get(where.merchantId) || null;
        if (where.integrationId) return [...pairings.values()].find((item) => item.integrationId === where.integrationId) || null;
        return null;
      }),
      findMany: vi.fn(async ({ where }) => [...pairings.values()].filter((item) => {
        return !where.expiresAt?.lt || item.expiresAt < where.expiresAt.lt;
      })),
      deleteMany: vi.fn(async ({ where }) => {
        let count = 0;
        for (const [merchantId, value] of pairings.entries()) {
          const merchantMatches = !where.merchantId || merchantId === where.merchantId || where.merchantId?.in?.includes(merchantId);
          const expiryMatches = !where.expiresAt ||
            (where.expiresAt instanceof Date && value.expiresAt.getTime() === where.expiresAt.getTime()) ||
            (where.expiresAt?.lt && value.expiresAt < where.expiresAt.lt);
          const matches = merchantMatches &&
            (!where.integrationId || value.integrationId === where.integrationId) &&
            expiryMatches;
          if (matches) {
            pairings.delete(merchantId);
            count += 1;
          }
        }
        return { count };
      })
    }
  };
  prisma.$queryRawUnsafe = vi.fn(async () => [{ pg_advisory_xact_lock: null }]);
  prisma.$transaction = vi.fn(async (operation) => operation(prisma));
  const queue = { enqueueFullSync: vi.fn(async () => ({ id: 'sync-job' })) };
  const randomBytes = vi.fn(() => Buffer.alloc(24, 7));
  const service = createSallaEasyModeService({ prisma, queue, clock, randomBytes, appId });
  return { integrations, pending, pairings, prisma, queue, randomBytes, service };
}

describe('Salla Easy Mode service', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = encryptionKey;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  it('creates a one-time pairing code but persists only its hash', async () => {
    const { service, prisma, integrations } = createHarness();

    const result = await service.createConnection({ tenantId: 'tenant-1' });

    expect(result).toEqual({
      mode: 'easy',
      integrationId: 'integration-2',
      pairingCode: Buffer.alloc(24, 7).toString('base64url'),
      installUrl: 'https://s.salla.sa/apps/install/946600964'
    });
    expect(integrations[1].metadata).toEqual({
      installationMode: 'easy',
      pairingCodeHash: crypto.createHash('sha256').update(result.pairingCode).digest('hex'),
      pairingExpiresAt: '2026-08-27T10:30:00.000Z'
    });
    expect(JSON.stringify(prisma.integration.create.mock.calls)).not.toContain(result.pairingCode);
    expect(decryptStoreCredentials(integrations[1].credentials)).toEqual({ provider: 'salla', pending: true });
  });

  it('fails before persistence when the Salla app ID is missing', async () => {
    const { service, prisma } = createHarness({ appId: '' });

    await expect(service.createConnection({ tenantId: 'tenant-1' }))
      .rejects.toMatchObject({ code: 'SALLA_EASY_MODE_NOT_CONFIGURED' });
    expect(prisma.integration.create).not.toHaveBeenCalled();
  });

  it('activates and syncs when authorization arrives before settings', async () => {
    const pairingCode = 'connection-code-123';
    const { service, integrations, pending, queue } = createHarness({
      integrationOverrides: {
        metadata: {
          installationMode: 'easy',
          pairingCodeHash: crypto.createHash('sha256').update(pairingCode).digest('hex'),
          pairingExpiresAt: '2026-08-27T10:30:00.000Z'
        }
      }
    });

    expect(await service.handleAuthorization({ merchantId: '42', data: authorizationData }))
      .toMatchObject({ outcome: 'staged', activated: false });
    expect(await service.handleSettingsUpdated({
      merchantId: '42', settings: { valuechat_connection_code: pairingCode }
    })).toMatchObject({ outcome: 'activated', activated: true, integrationId: 'integration-1' });

    expect(integrations[0]).toMatchObject({ status: 'active', externalAccountId: '42', metadata: { installationMode: 'easy' } });
    expect(decryptStoreCredentials(integrations[0].credentials)).toEqual({
      accessToken: 'access-secret', refreshToken: 'refresh-secret', expiresAt: '2026-08-28T10:00:00.000Z'
    });
    expect(pending.has('42')).toBe(false);
    expect(queue.enqueueFullSync).toHaveBeenCalledOnce();
  });

  it('activates and syncs when settings arrive before authorization', async () => {
    const pairingCode = 'connection-code-456';
    const { service, integrations, queue } = createHarness({
      integrationOverrides: {
        metadata: {
          installationMode: 'easy',
          pairingCodeHash: crypto.createHash('sha256').update(pairingCode).digest('hex'),
          pairingExpiresAt: '2026-08-27T10:30:00.000Z'
        }
      }
    });

    expect(await service.handleSettingsUpdated({
      merchantId: '43', settings: { valuechat_connection_code: pairingCode }
    })).toMatchObject({ outcome: 'staged', activated: false });
    expect(integrations[0].metadata).toEqual({
      installationMode: 'easy',
      pendingMerchantId: '43'
    });
    expect(await service.handleAuthorization({ merchantId: '43', data: authorizationData }))
      .toMatchObject({ outcome: 'activated', activated: true });

    expect(integrations[0]).toMatchObject({ status: 'active', externalAccountId: '43' });
    expect(queue.enqueueFullSync).toHaveBeenCalledOnce();
  });

  it('uses the pending status transition as the duplicate activation gate', async () => {
    const pairingCode = 'connection-code-789';
    const { service, queue, pairings } = createHarness({
      integrationOverrides: {
        metadata: {
          installationMode: 'easy', pendingMerchantId: '44',
          pairingCodeHash: crypto.createHash('sha256').update(pairingCode).digest('hex'),
          pairingExpiresAt: '2026-08-27T10:30:00.000Z'
        }
      }
    });
    pairings.set('44', {
      merchantId: '44', integrationId: 'integration-1', tenantId: 'tenant-1',
      expiresAt: new Date('2026-08-28T10:00:00.000Z')
    });
    await service.handleAuthorization({ merchantId: '44', data: authorizationData });

    await Promise.all([
      service.handleAuthorization({ merchantId: '44', data: authorizationData }),
      service.handleAuthorization({ merchantId: '44', data: authorizationData })
    ]);

    expect(queue.enqueueFullSync).toHaveBeenCalledOnce();
  });

  it.each([
    ['settings.read offline_access', 'missing product scope'],
    ['products.read', 'missing offline access']
  ])('rejects authorization with %s (%s)', async (scope) => {
    const { service, prisma } = createHarness();

    await expect(service.handleAuthorization({ merchantId: '42', data: { ...authorizationData, scope } }))
      .rejects.toMatchObject({ code: 'SALLA_REQUIRED_SCOPE_MISSING' });
    expect(prisma.sallaPendingAuthorization.upsert).not.toHaveBeenCalled();
  });

  it('ignores wrong, expired, and cross-tenant pairing attempts', async () => {
    const pairingCode = 'connection-code-safe';
    const { service, integrations, queue } = createHarness({
      integrationOverrides: {
        metadata: {
          installationMode: 'easy',
          pairingCodeHash: crypto.createHash('sha256').update(pairingCode).digest('hex'),
          pairingExpiresAt: '2026-08-27T09:59:59.000Z'
        }
      }
    });

    expect(await service.handleSettingsUpdated({
      merchantId: '42', settings: { valuechat_connection_code: 'wrong-code' }
    })).toEqual({ outcome: 'ignored', activated: false });
    expect(await service.handleSettingsUpdated({
      merchantId: '42', settings: { valuechat_connection_code: pairingCode }
    })).toEqual({ outcome: 'ignored', activated: false });

    integrations[0].metadata.pairingExpiresAt = '2026-08-27T10:30:00.000Z';
    integrations.push({
      id: 'integration-owner', tenantId: 'tenant-2', type: 'store_salla', status: 'active',
      externalAccountId: '42', metadata: { installationMode: 'easy' }
    });
    expect(await service.handleSettingsUpdated({
      merchantId: '42', settings: { valuechat_connection_code: pairingCode }
    })).toEqual({ outcome: 'ignored', activated: false });
    expect(queue.enqueueFullSync).not.toHaveBeenCalled();
  });

  it('rotates credentials for an active merchant without creating another integration', async () => {
    const { service, integrations, prisma, queue } = createHarness({
      integrationOverrides: { status: 'active', externalAccountId: '42', metadata: { installationMode: 'easy' } }
    });

    expect(await service.handleAuthorization({ merchantId: '42', data: authorizationData }))
      .toMatchObject({ outcome: 'rotated', activated: true, integrationId: 'integration-1' });

    expect(integrations).toHaveLength(1);
    expect(decryptStoreCredentials(integrations[0].credentials).accessToken).toBe('access-secret');
    expect(prisma.sallaPendingAuthorization.upsert).not.toHaveBeenCalled();
    expect(queue.enqueueFullSync).toHaveBeenCalledOnce();
  });

  it('retries the required sync after a queue failure without losing activation state', async () => {
    const pairingCode = 'connection-code-retry';
    const { service, integrations, queue } = createHarness({
      integrationOverrides: {
        metadata: {
          installationMode: 'easy',
          pairingCodeHash: crypto.createHash('sha256').update(pairingCode).digest('hex'),
          pairingExpiresAt: '2026-08-27T10:30:00.000Z'
        }
      }
    });
    queue.enqueueFullSync.mockRejectedValueOnce(new Error('redis unavailable')).mockResolvedValueOnce({ id: 'sync-job' });

    await service.handleAuthorization({ merchantId: '42', data: authorizationData });
    await expect(service.handleSettingsUpdated({
      merchantId: '42', settings: { valuechat_connection_code: pairingCode }
    })).rejects.toMatchObject({ code: 'SALLA_INITIAL_SYNC_FAILED' });

    expect(integrations[0]).toMatchObject({ status: 'error', metadata: { installationMode: 'easy', syncRequired: true } });
    await expect(service.handleAuthorization({ merchantId: '42', data: authorizationData }))
      .resolves.toMatchObject({ outcome: 'recovered', activated: true });
    expect(integrations[0].status).toBe('active');
    expect(integrations[0].metadata.syncRequired).toBeUndefined();
    expect(queue.enqueueFullSync).toHaveBeenCalledTimes(2);
  });

  it('does not replace newer active credentials with an older authorization event', async () => {
    const newerCredentials = {
      accessToken: 'newer-access', refreshToken: 'newer-refresh', expiresAt: '2026-08-29T10:00:00.000Z'
    };
    const { service, integrations, queue } = createHarness({
      integrationOverrides: {
        status: 'active', externalAccountId: '42', credentials: encryptStoreCredentials(newerCredentials),
        metadata: { installationMode: 'easy', authorizationExpiresAt: newerCredentials.expiresAt }
      }
    });

    await expect(service.handleAuthorization({ merchantId: '42', data: authorizationData }))
      .resolves.toMatchObject({ outcome: 'stale', activated: false });
    expect(decryptStoreCredentials(integrations[0].credentials)).toEqual(newerCredentials);
    expect(queue.enqueueFullSync).not.toHaveBeenCalled();
  });

  it('accepts a causally newer authorization even when its token expires sooner', async () => {
    const currentCredentials = {
      accessToken: 'current-access', refreshToken: 'current-refresh', expiresAt: '2026-08-29T10:00:00.000Z'
    };
    const { service, integrations, queue } = createHarness({
      integrationOverrides: {
        status: 'active', externalAccountId: '42', credentials: encryptStoreCredentials(currentCredentials),
        metadata: { installationMode: 'easy', authorizationEventAt: '2026-08-27T09:00:00.000Z' }
      }
    });

    await expect(service.handleAuthorization({
      merchantId: '42', data: authorizationData, eventCreatedAt: '2026-08-27 10:00:00'
    })).resolves.toMatchObject({ outcome: 'rotated', activated: true });
    expect(decryptStoreCredentials(integrations[0].credentials).accessToken).toBe('access-secret');
    expect(queue.enqueueFullSync).toHaveBeenCalledOnce();
  });

  it('allows only one pending integration to claim a merchant', async () => {
    const firstCode = 'connection-code-first';
    const secondCode = 'connection-code-second';
    const { service, integrations, pairings } = createHarness({
      integrationOverrides: {
        metadata: {
          installationMode: 'easy',
          pairingCodeHash: crypto.createHash('sha256').update(firstCode).digest('hex'),
          pairingExpiresAt: '2026-08-27T10:30:00.000Z'
        }
      }
    });
    integrations.push({
      id: 'integration-2', tenantId: 'tenant-2', type: 'store_salla', status: 'pending',
      externalAccountId: null, credentials: 'pending',
      metadata: {
        installationMode: 'easy',
        pairingCodeHash: crypto.createHash('sha256').update(secondCode).digest('hex'),
        pairingExpiresAt: '2026-08-27T10:30:00.000Z'
      }
    });

    await expect(service.handleSettingsUpdated({
      merchantId: '42', settings: { valuechat_connection_code: firstCode }
    })).resolves.toMatchObject({ outcome: 'staged' });
    await expect(service.handleSettingsUpdated({
      merchantId: '42', settings: { valuechat_connection_code: secondCode }
    })).resolves.toEqual({ outcome: 'ignored', activated: false });
    expect(pairings.get('42')).toMatchObject({ integrationId: 'integration-1', tenantId: 'tenant-1' });
  });

  it('recovers an error installation when a newer authorization arrives', async () => {
    const oldCredentials = {
      accessToken: 'old-access', refreshToken: 'old-refresh', expiresAt: '2026-08-27T11:00:00.000Z'
    };
    const { service, integrations, queue } = createHarness({
      integrationOverrides: {
        status: 'error', externalAccountId: '42', credentials: encryptStoreCredentials(oldCredentials),
        metadata: { installationMode: 'easy', authorizationExpiresAt: oldCredentials.expiresAt }
      }
    });

    await expect(service.handleAuthorization({ merchantId: '42', data: authorizationData }))
      .resolves.toMatchObject({ outcome: 'rotated', activated: true });
    expect(integrations[0].status).toBe('active');
    expect(queue.enqueueFullSync).toHaveBeenCalledOnce();
  });

  it('keeps a settings-first claim after the original pairing code expires', async () => {
    let current = now;
    const pairingCode = 'connection-code-accepted';
    const { service, integrations, pairings } = createHarness({
      clock: () => current,
      integrationOverrides: {
        metadata: {
          installationMode: 'easy',
          pairingCodeHash: crypto.createHash('sha256').update(pairingCode).digest('hex'),
          pairingExpiresAt: '2026-08-27T10:30:00.000Z'
        }
      }
    });

    await service.handleSettingsUpdated({ merchantId: '42', settings: { valuechat_connection_code: pairingCode } });
    current = new Date('2026-08-27T11:00:00.000Z');
    await service.reconcilePending();

    expect(integrations.some((item) => item.id === 'integration-1')).toBe(true);
    expect(pairings.get('42')).toMatchObject({ integrationId: 'integration-1' });
  });

  it('does not reactivate an installation uninstalled while its sync is being enqueued', async () => {
    const pairingCode = 'connection-code-uninstall';
    let releaseQueue;
    const { service, integrations, queue } = createHarness({
      integrationOverrides: {
        metadata: {
          installationMode: 'easy',
          pairingCodeHash: crypto.createHash('sha256').update(pairingCode).digest('hex'),
          pairingExpiresAt: '2026-08-27T10:30:00.000Z'
        }
      }
    });
    queue.enqueueFullSync.mockImplementation(() => new Promise((resolve) => { releaseQueue = resolve; }));
    await service.handleAuthorization({ merchantId: '42', data: authorizationData });

    const activation = service.handleSettingsUpdated({
      merchantId: '42', settings: { valuechat_connection_code: pairingCode }
    });
    await vi.waitFor(() => expect(queue.enqueueFullSync).toHaveBeenCalledOnce());
    await service.handleUninstalled({ merchantId: '42' });
    releaseQueue({ id: 'sync-job' });
    await activation;

    expect(integrations[0].status).toBe('revoked');
  });

  it('reconciles the exact expired pairing set using one cutoff', async () => {
    const firstCutoff = new Date('2026-08-27T10:00:00.000Z');
    const laterCutoff = new Date('2026-08-27T10:00:01.000Z');
    const clock = vi.fn().mockReturnValueOnce(firstCutoff).mockReturnValue(laterCutoff);
    const { service, integrations, pairings } = createHarness({ clock });
    integrations.splice(0, 1,
      { id: 'expired-claim', tenantId: 'tenant-1', type: 'store_salla', status: 'pending', metadata: { installationMode: 'easy' } },
      { id: 'future-claim', tenantId: 'tenant-2', type: 'store_salla', status: 'pending', metadata: { installationMode: 'easy' } }
    );
    pairings.set('expired', {
      merchantId: 'expired', integrationId: 'expired-claim', tenantId: 'tenant-1',
      expiresAt: new Date('2026-08-27T09:59:59.000Z')
    });
    pairings.set('future', {
      merchantId: 'future', integrationId: 'future-claim', tenantId: 'tenant-2',
      expiresAt: new Date('2026-08-27T10:00:00.500Z')
    });

    await expect(service.reconcilePending()).resolves.toMatchObject({ integrations: 1, pairings: 1 });
    expect(pairings.has('expired')).toBe(false);
    expect(pairings.has('future')).toBe(true);
    expect(integrations.some((item) => item.id === 'future-claim')).toBe(true);
  });

  it('does not delete a replacement pairing created after reconciliation selection', async () => {
    const { service, integrations, pairings, prisma } = createHarness();
    integrations.splice(0, 1,
      { id: 'old-integration', tenantId: 'tenant-1', type: 'store_salla', status: 'pending', metadata: { installationMode: 'easy' } },
      { id: 'new-integration', tenantId: 'tenant-1', type: 'store_salla', status: 'pending', metadata: { installationMode: 'easy' } }
    );
    const expired = {
      merchantId: '42', integrationId: 'old-integration', tenantId: 'tenant-1',
      expiresAt: new Date('2026-08-27T09:00:00.000Z')
    };
    pairings.set('42', expired);
    prisma.sallaPendingPairing.findMany.mockImplementationOnce(async () => {
      pairings.set('42', {
        merchantId: '42', integrationId: 'new-integration', tenantId: 'tenant-1',
        expiresAt: new Date('2026-08-28T10:00:00.000Z')
      });
      return [expired];
    });

    await service.reconcilePending();

    expect(pairings.get('42')).toMatchObject({ integrationId: 'new-integration' });
    expect(integrations.some((item) => item.id === 'new-integration')).toBe(true);
  });

  it('revokes matching installations and removes only expired pending state', async () => {
    const { service, integrations, pending, prisma } = createHarness({
      integrationOverrides: { status: 'active', externalAccountId: '42', metadata: { installationMode: 'easy' } }
    });
    pending.set('42', { merchantId: '42', expiresAt: new Date('2026-08-27T09:00:00.000Z') });
    integrations.push({
      id: 'expired-integration', tenantId: 'tenant-2', type: 'store_salla', status: 'pending',
      metadata: { installationMode: 'easy', pairingCodeHash: 'expired', pairingExpiresAt: '2026-08-27T09:59:59.000Z' }
    }, {
      id: 'live-integration', tenantId: 'tenant-3', type: 'store_salla', status: 'pending',
      metadata: { installationMode: 'easy', pairingExpiresAt: '2026-08-27T10:30:00.000Z' }
    });

    await service.handleUninstalled({ merchantId: '42' });
    expect(integrations[0].status).toBe('revoked');
    expect(pending.has('42')).toBe(false);

    pending.set('old', { merchantId: 'old', expiresAt: new Date('2026-08-27T09:00:00.000Z') });
    pending.set('live', { merchantId: 'live', expiresAt: new Date('2026-08-27T11:00:00.000Z') });
    expect(await service.reconcilePending()).toEqual({ integrations: 1, authorizations: 1, pairings: 0 });
    expect(integrations.some((item) => item.id === 'expired-integration')).toBe(false);
    expect(integrations.some((item) => item.id === 'live-integration')).toBe(true);
    expect(pending.has('old')).toBe(false);
    expect(pending.has('live')).toBe(true);
    expect(prisma.integration.findMany).toHaveBeenCalledWith({
      where: {
        type: 'store_salla', status: 'pending',
        metadata: { path: ['installationMode'], equals: 'easy' }
      },
      select: { id: true, metadata: true }
    });
  });
});
