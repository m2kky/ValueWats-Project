const { decryptStoreCredentials, encryptStoreCredentials } = require('../../../src/stores/storeCredentialCrypto');
const { createSallaTokenService } = require('../../../src/stores/providers/salla/sallaTokenService');

describe('Salla token service', () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  const originalClientId = process.env.SALLA_CLIENT_ID;
  const originalClientSecret = process.env.SALLA_CLIENT_SECRET;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    process.env.SALLA_CLIENT_ID = 'client-id';
    process.env.SALLA_CLIENT_SECRET = 'client-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = originalKey;
    if (originalClientId === undefined) delete process.env.SALLA_CLIENT_ID; else process.env.SALLA_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.SALLA_CLIENT_SECRET; else process.env.SALLA_CLIENT_SECRET = originalClientSecret;
  });

  it('collapses concurrent refreshes into one rotating-token exchange', async () => {
    const integration = {
      id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'active',
      credentials: encryptStoreCredentials({ accessToken: 'old-a', refreshToken: 'old-r', expiresAt: '2026-08-01T00:00:00.000Z' })
    };
    const prisma = {
      integration: {
        findFirst: vi.fn().mockImplementation(async () => ({ ...integration })),
        updateMany: vi.fn().mockImplementation(async ({ data }) => {
          integration.credentials = data.credentials;
          integration.status = data.status || integration.status;
          return { count: 1 };
        })
      },
      $transaction: vi.fn(async (callback) => callback(prisma)),
      $queryRawUnsafe: vi.fn().mockResolvedValue(undefined)
    };
    const http = { post: vi.fn().mockResolvedValue({ data: { access_token: 'new-a', refresh_token: 'new-r', expires_in: 1209600 } }) };
    const clock = () => new Date('2026-08-26T10:00:00Z');
    const service = createSallaTokenService({ prisma, http, clock });
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});

    const [first, second] = await Promise.all([
      service.getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true }),
      service.getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true })
    ]);

    expect(first).toBe('new-a');
    expect(second).toBe('new-a');
    expect(http.post).toHaveBeenCalledOnce();
    expect(prisma.integration.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'active' }
    }));
    expect(decryptStoreCredentials(integration.credentials)).toMatchObject({ accessToken: 'new-a', refreshToken: 'new-r' });
    expect(JSON.stringify(log.mock.calls)).not.toContain('old-r');
    expect(JSON.stringify(log.mock.calls)).not.toContain('new-r');
  });

  it('casts the refresh advisory lock result so Prisma does not deserialize PostgreSQL void', async () => {
    const integration = {
      credentials: encryptStoreCredentials({
        accessToken: 'expired-access', refreshToken: 'refresh-token', expiresAt: '2026-08-26T00:00:00.000Z'
      })
    };
    const prisma = {
      integration: {
        findFirst: vi.fn(async () => integration),
        updateMany: vi.fn(async () => ({ count: 1 }))
      }
    };
    prisma.$queryRawUnsafe = vi.fn(async (query) => {
      if (!query.includes('::text')) {
        throw Object.assign(new Error("Failed to deserialize column of type 'void'"), { code: 'P2010' });
      }
      return [{ lock: '' }];
    });
    prisma.$transaction = vi.fn(async (operation) => operation(prisma));
    const http = { post: vi.fn(async () => ({
      data: { access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 1209600 }
    })) };
    const service = createSallaTokenService({ prisma, http, clock: () => new Date('2026-08-27T10:00:00.000Z') });

    await expect(service.getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1' }))
      .resolves.toBe('new-access');
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(hashtext($1))::text AS lock',
      'salla:integration-1'
    );
  });

  it('marks a tenant-scoped integration for reauthorization after an unrecoverable OAuth response', async () => {
    const integration = {
      id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla',
      credentials: encryptStoreCredentials({ accessToken: 'old-a', refreshToken: 'old-r', expiresAt: '2026-08-01T00:00:00.000Z' })
    };
    let transactionCommitted = false;
    const prisma = {
      integration: {
        findFirst: vi.fn().mockResolvedValue(integration),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      $transaction: vi.fn(async (callback) => {
        const result = await callback(prisma);
        transactionCommitted = true;
        return result;
      }),
      $queryRawUnsafe: vi.fn().mockResolvedValue(undefined)
    };
    const http = { post: vi.fn().mockRejectedValue(Object.assign(new Error('invalid refresh'), { response: { status: 400, data: { refresh_token: 'old-r' } } })) };

    await expect(createSallaTokenService({ prisma, http, clock: () => new Date('2026-08-26T10:00:00Z') })
      .getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true }))
      .rejects.toMatchObject({ code: 'STORE_REAUTHORIZATION_REQUIRED' });
    expect(prisma.integration.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'active' },
      data: { status: 'reauthorization_required' }
    }));
    expect(transactionCommitted).toBe(true);
  });

  it('does not let a normal lookup join an in-progress forced refresh', async () => {
    const integration = {
      id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla',
      credentials: encryptStoreCredentials({ accessToken: 'old-a', refreshToken: 'old-r', expiresAt: '2026-09-01T00:00:00.000Z' })
    };
    const prisma = {
      integration: {
        findFirst: vi.fn().mockImplementation(async () => ({ ...integration })),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      $transaction: vi.fn(async (callback) => callback(prisma)),
      $queryRawUnsafe: vi.fn().mockResolvedValue(undefined)
    };
    const http = { post: vi.fn().mockResolvedValue({ data: { access_token: 'new-a', refresh_token: 'new-r', expires_in: 1209600 } }) };
    const service = createSallaTokenService({ prisma, http, clock: () => new Date('2026-08-26T10:00:00Z') });

    const [normal, forced] = await Promise.all([
      service.getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: false }),
      service.getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true })
    ]);

    expect(normal).toBe('old-a');
    expect(forced).toBe('new-a');
    expect(http.post).toHaveBeenCalledOnce();
  });

  it('does not reactivate an integration revoked during token refresh', async () => {
    const integration = {
      id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'active',
      credentials: encryptStoreCredentials({ accessToken: 'old-a', refreshToken: 'old-r', expiresAt: '2026-08-01T00:00:00.000Z' })
    };
    const prisma = {
      integration: {
        findFirst: vi.fn().mockImplementation(async ({ where }) => (!where.status || integration.status === 'active') ? { ...integration } : null),
        updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
          integration.status = 'revoked';
          if (where.status === 'active' && integration.status !== 'active') return { count: 0 };
          integration.status = data.status || integration.status;
          return { count: 1 };
        })
      },
      $transaction: vi.fn(async (callback) => callback(prisma)),
      $queryRawUnsafe: vi.fn().mockResolvedValue(undefined)
    };
    const http = { post: vi.fn().mockResolvedValue({ data: { access_token: 'new-a', refresh_token: 'new-r', expires_in: 1209600 } }) };

    await expect(createSallaTokenService({ prisma, http, clock: () => new Date('2026-08-26T10:00:00Z') })
      .getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true }))
      .rejects.toMatchObject({ code: 'STORE_INTEGRATION_NOT_FOUND' });
    expect(integration.status).toBe('revoked');
    expect(prisma.integration.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'active' }
    }));
  });

  it('sanitizes unexpected token lifecycle failures into a stable error', async () => {
    const prisma = {
      integration: { findFirst: vi.fn().mockRejectedValue(new Error('database password=secret-value')) },
      $transaction: vi.fn(), $queryRawUnsafe: vi.fn()
    };
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});

    await expect(createSallaTokenService({ prisma }).getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1' }))
      .rejects.toMatchObject({ code: 'STORE_TOKEN_REFRESH_FAILED' });
    expect(JSON.stringify(log.mock.calls)).not.toContain('secret-value');
  });

  it('sanitizes malformed rotated-token expiries into a stable error', async () => {
    const integration = {
      id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla',
      credentials: encryptStoreCredentials({ accessToken: 'old-a', refreshToken: 'old-r', expiresAt: '2026-08-01T00:00:00.000Z' })
    };
    const prisma = {
      integration: { findFirst: vi.fn().mockResolvedValue(integration), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      $transaction: vi.fn(async (callback) => callback(prisma)),
      $queryRawUnsafe: vi.fn().mockResolvedValue(undefined)
    };
    const http = { post: vi.fn().mockResolvedValue({ data: { access_token: 'new-a', refresh_token: 'new-r', expires_in: Number.MAX_VALUE } }) };

    await expect(createSallaTokenService({ prisma, http, clock: () => new Date('2026-08-26T10:00:00Z') })
      .getAccessToken({ tenantId: 'tenant-1', integrationId: 'integration-1', forceRefresh: true }))
      .rejects.toMatchObject({ code: 'STORE_TOKEN_REFRESH_FAILED' });
  });
});
