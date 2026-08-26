const crypto = require('crypto');
const { decryptStoreCredentials } = require('../../../src/stores/storeCredentialCrypto');
const { createStoreOAuthState } = require('../../../src/stores/storeOAuthState');
const { createSallaOAuthService } = require('../../../src/stores/providers/salla/sallaOAuthService');

const key = crypto.randomBytes(32).toString('base64');

function useSallaConfig() {
  process.env.SALLA_CLIENT_ID = 'salla-client';
  process.env.SALLA_CLIENT_SECRET = 'salla-secret';
  process.env.SALLA_REDIRECT_URI = 'https://app.example.test/api/oauth/salla/callback';
  process.env.ENCRYPTION_KEY = key;
}

function harness() {
  const integration = {
    id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', name: 'Salla Store',
    credentials: null, status: 'pending', externalAccountId: null, metadata: null,
    createdAt: new Date('2026-08-26T10:00:00Z')
  };
  const prisma = {
    integration: {
      create: vi.fn(async ({ data }) => Object.assign(integration, data)),
      findFirst: vi.fn(async () => integration),
      updateMany: vi.fn(async ({ data }) => {
        Object.assign(integration, data);
        return { count: 1 };
      }),
      deleteMany: vi.fn(async () => ({ count: 0 }))
    }
  };
  const http = {
    post: vi.fn(async () => ({ data: { access_token: 'access-secret', refresh_token: 'refresh-secret', expires_in: 3600 } })),
    get: vi.fn(async () => ({ data: { merchant: { id: 42, name: 'Safe Store', domain: 'safe-store' } } }))
  };
  const queue = { enqueueFullSync: vi.fn(async () => ({ id: 'sync-1' })) };
  const now = new Date('2026-08-26T10:00:00Z');
  return { integration, prisma, http, queue, now, service: createSallaOAuthService({ prisma, http, queue, clock: () => now }) };
}

describe('Salla OAuth service', () => {
  const environment = Object.fromEntries(['SALLA_CLIENT_ID', 'SALLA_CLIENT_SECRET', 'SALLA_REDIRECT_URI', 'ENCRYPTION_KEY'].map((name) => [name, process.env[name]]));

  beforeEach(useSallaConfig);
  afterEach(() => {
    vi.restoreAllMocks();
    for (const [name, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it('fails with SALLA_NOT_CONFIGURED before creating a pending integration', async () => {
    const { service, prisma } = harness();
    delete process.env.SALLA_CLIENT_ID;

    await expect(service.createAuthUrl({ tenantId: 'tenant-1' })).rejects.toMatchObject({ code: 'SALLA_NOT_CONFIGURED' });
    expect(prisma.integration.create).not.toHaveBeenCalled();
  });

  it('creates encrypted pending credentials and an exact offline product-read authorization URL', async () => {
    const { service, integration, now } = harness();

    const { authUrl } = await service.createAuthUrl({ tenantId: 'tenant-1' });
    const url = new URL(authUrl);

    expect(url.origin + url.pathname).toBe('https://accounts.salla.sa/oauth2/auth');
    expect(url.searchParams.get('scope')).toBe('products.read offline_access');
    expect(decryptStoreCredentials(integration.credentials)).toEqual({ provider: 'salla', pending: true });
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(createStoreOAuthState).toBeTypeOf('function');
    expect(now).toBeInstanceOf(Date);
  });

  it('verifies state before lookup, rotates encrypted credentials, and starts the initial sync', async () => {
    const { service, integration, prisma, http, queue, now } = harness();
    const state = createStoreOAuthState({ integrationId: integration.id, now });

    await service.completeCallback({ code: 'authorization-code', state });

    expect(prisma.integration.findFirst).toHaveBeenCalledWith({ where: { id: integration.id, type: 'store_salla', status: 'pending' } });
    expect(http.post).toHaveBeenCalledWith('https://accounts.salla.sa/oauth2/token', expect.stringContaining('grant_type=authorization_code'), expect.any(Object));
    expect(http.get).toHaveBeenCalledWith('https://accounts.salla.sa/oauth2/user/info', expect.objectContaining({ headers: { Authorization: 'Bearer access-secret' } }));
    expect(decryptStoreCredentials(integration.credentials)).toEqual({
      accessToken: 'access-secret', refreshToken: 'refresh-secret', expiresAt: '2026-08-26T11:00:00.000Z'
    });
    expect(integration).toMatchObject({ status: 'active', externalAccountId: '42', metadata: { merchantName: 'Safe Store', merchantDomain: 'safe-store' } });
    expect(queue.enqueueFullSync).toHaveBeenCalledWith({ tenantId: 'tenant-1', integrationId: 'integration-1' });
  });

  it('rejects tampered state without querying integrations or exchanging codes', async () => {
    const { service, prisma, http } = harness();

    await expect(service.completeCallback({ code: 'authorization-code', state: 'tampered' })).rejects.toMatchObject({ code: 'SALLA_INVALID_STATE' });
    expect(prisma.integration.findFirst).not.toHaveBeenCalled();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('retains credentials but marks the integration error when initial enqueue fails', async () => {
    const { service, integration, queue, now } = harness();
    queue.enqueueFullSync.mockRejectedValue(new Error('redis-password'));
    const state = createStoreOAuthState({ integrationId: integration.id, now });

    await expect(service.completeCallback({ code: 'authorization-code', state })).rejects.toMatchObject({ code: 'SALLA_INITIAL_SYNC_FAILED' });
    expect(integration.status).toBe('error');
    expect(decryptStoreCredentials(integration.credentials).accessToken).toBe('access-secret');
  });

  it('logs stable metadata without codes or tokens', async () => {
    const { service, integration, http, now } = harness();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    http.post.mockRejectedValue(new Error('provider-body-access-secret'));
    const state = createStoreOAuthState({ integrationId: integration.id, now });

    await expect(service.completeCallback({ code: 'authorization-code', state })).rejects.toMatchObject({ code: 'SALLA_TOKEN_EXCHANGE_FAILED' });
    const output = JSON.stringify(info.mock.calls);
    expect(output).toContain('SALLA_TOKEN_EXCHANGE_FAILED');
    expect(output).not.toContain('authorization-code');
    expect(output).not.toContain('access-secret');
    expect(output).not.toContain('provider-body-access-secret');
  });

  it('removes only pending Salla integrations older than one hour during reconciliation', async () => {
    const { service, prisma } = harness();

    await service.reconcilePending();

    expect(prisma.integration.deleteMany).toHaveBeenCalledWith({
      where: {
        type: 'store_salla', status: 'pending',
        createdAt: { lt: new Date('2026-08-26T09:00:00.000Z') }
      }
    });
  });
});
