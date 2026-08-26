const request = require('supertest');
const { createApp } = require('../../../src/app');
const integrationsRouter = require('../../../src/routes/integrations');
const oauthRouter = require('../../../src/routes/oauth');

function createHarness(role = 'admin') {
  const prisma = {
    integration: {
      findFirst: vi.fn(async () => null),
      deleteMany: vi.fn(async () => ({ count: 0 }))
    }
  };
  const storeSync = { enqueueFullSync: vi.fn(async () => ({ id: 'job-1' })) };
  const sallaOAuthService = {
    createAuthUrl: vi.fn(async () => ({ authUrl: 'https://accounts.salla.sa/oauth2/auth?scope=products.read+offline_access' })),
    reconnect: vi.fn(async () => ({ authUrl: 'https://accounts.salla.sa/oauth2/auth?state=reconnect' })),
    completeCallback: vi.fn(async () => ({ id: 'integration-1' }))
  };
  const integrationService = { listIntegrations: vi.fn(), upsertIntegration: vi.fn() };
  const app = createApp({
    routes: { integrations: integrationsRouter, oauth: oauthRouter },
    middleware: { tenantContext: (req, res, next) => { req.user = { tenantId: 'tenant-1', role }; next(); } },
    dependencies: { prisma, queues: { storeSync }, sallaOAuthService, integrationService }
  });
  return { app, prisma, storeSync, sallaOAuthService, integrationService };
}

describe('Salla integration API', () => {
  it('requires integrations.manage before starting Salla authorization', async () => {
    const { app, sallaOAuthService } = createHarness('agent');

    await request(app).post('/api/integrations/salla/auth-url').expect(403);
    expect(sallaOAuthService.createAuthUrl).not.toHaveBeenCalled();
  });

  it('starts authorization for the authenticated tenant', async () => {
    const { app, sallaOAuthService } = createHarness();

    await request(app).post('/api/integrations/salla/auth-url').expect(200, {
      authUrl: 'https://accounts.salla.sa/oauth2/auth?scope=products.read+offline_access'
    });
    expect(sallaOAuthService.createAuthUrl).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
  });

  it('blocks reserved Store types on generic integration creation', async () => {
    const { app, integrationService } = createHarness();

    await request(app).post('/api/integrations').send({ type: 'store_salla', name: 'Fake', credentials: '{}' }).expect(400, {
      error: 'Store integrations must use provider authorization', code: 'RESERVED_INTEGRATION_TYPE'
    });
    expect(integrationService.upsertIntegration).not.toHaveBeenCalled();
  });

  it('does not enqueue a sync for an ID outside the tenant-owned Salla scope', async () => {
    const { app, prisma, storeSync } = createHarness();

    await request(app).post('/api/integrations/salla/other-tenant/sync').expect(404, { error: 'STORE_INTEGRATION_NOT_FOUND' });
    expect(prisma.integration.findFirst).toHaveBeenCalledWith({ where: { id: 'other-tenant', tenantId: 'tenant-1', type: 'store_salla' } });
    expect(storeSync.enqueueFullSync).not.toHaveBeenCalled();
  });

  it('redirects the Salla callback to settings on success and stable errors', async () => {
    const { app, sallaOAuthService } = createHarness();

    await request(app).get('/api/oauth/salla/callback?code=code&state=state').expect(302).expect('Location', '/settings/integrations?success=true');
    sallaOAuthService.completeCallback.mockRejectedValue(Object.assign(new Error('secret'), { code: 'SALLA_INVALID_STATE' }));
    await request(app).get('/api/oauth/salla/callback?code=code&state=state').expect(302).expect('Location', '/settings/integrations?error=SALLA_INVALID_STATE');
  });
});
