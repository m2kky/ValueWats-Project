const request = require('supertest');
const crypto = require('node:crypto');
const express = require('express');
const { createApp } = require('../../../src/app');
const integrationsRouter = require('../../../src/routes/integrations');
const oauthRouter = require('../../../src/routes/oauth');

function createHarness(role = 'admin', integration = null, authMode = 'custom') {
  const prisma = {
    integration: {
      findFirst: vi.fn(async () => integration),
      updateMany: vi.fn(async ({ data }) => {
        Object.assign(integration, data);
        return { count: 1 };
      }),
      deleteMany: vi.fn(async () => ({ count: 0 }))
    }
  };
  const storeSync = { enqueueFullSync: vi.fn(async () => ({ id: 'job-1' })) };
  const sallaOAuthService = {
    createAuthUrl: vi.fn(async () => ({ authUrl: 'https://accounts.salla.sa/oauth2/auth?scope=products.read+offline_access&state=connect-state' })),
    reconnect: vi.fn(async () => ({ authUrl: 'https://accounts.salla.sa/oauth2/auth?state=reconnect-state' })),
    completeCallback: vi.fn(async () => ({ id: 'integration-1' }))
  };
  const sallaEasyModeService = {
    createConnection: vi.fn(async () => ({
      mode: 'easy', integrationId: 'integration-1', pairingCode: 'pair-code',
      installUrl: 'https://s.salla.sa/apps/install/946600964'
    })),
    reconnect: vi.fn(async () => ({
      mode: 'easy', integrationId: 'integration-1', pairingCode: 'new-pair-code',
      installUrl: 'https://s.salla.sa/apps/install/946600964'
    }))
  };
  const integrationService = { listIntegrations: vi.fn(), upsertIntegration: vi.fn() };
  const app = createApp({
    routes: { integrations: integrationsRouter, oauth: oauthRouter },
    middleware: { tenantContext: (req, res, next) => { req.user = { tenantId: 'tenant-1', role }; next(); } },
    dependencies: {
      prisma, queues: { storeSync }, sallaOAuthService, sallaEasyModeService,
      sallaAuthMode: authMode, integrationService
    }
  });
  return { app, prisma, storeSync, sallaOAuthService, sallaEasyModeService, integrationService };
}

function verifier(state) {
  return crypto.createHash('sha256').update(state).digest('hex');
}

function storeIntegration(status) {
  return { id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status };
}

describe('Salla integration API', () => {
  it('requires integrations.manage before starting Salla authorization', async () => {
    const { app, sallaOAuthService } = createHarness('agent');

    await request(app).post('/api/integrations/salla/auth-url').expect(403);
    expect(sallaOAuthService.createAuthUrl).not.toHaveBeenCalled();
  });

  it('starts authorization for the authenticated tenant', async () => {
    const { app, sallaOAuthService } = createHarness();

    const response = await request(app).post('/api/integrations/salla/auth-url').expect(200);

    expect(response.body).toEqual({
      authUrl: 'https://accounts.salla.sa/oauth2/auth?scope=products.read+offline_access&state=connect-state'
    });
    expect(response.headers['set-cookie']).toEqual([
      `salla_oauth_verifier=${verifier('connect-state')}; Max-Age=600; Path=/api/oauth/salla/callback; HttpOnly; SameSite=Lax`
    ]);
    expect(sallaOAuthService.createAuthUrl).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
  });

  it('returns an Easy Mode pairing code without setting an OAuth verifier cookie', async () => {
    const { app, sallaOAuthService, sallaEasyModeService } = createHarness('admin', null, 'easy');

    const response = await request(app).post('/api/integrations/salla/auth-url').expect(200);

    expect(response.body).toEqual({
      mode: 'easy', integrationId: 'integration-1', pairingCode: 'pair-code',
      installUrl: 'https://s.salla.sa/apps/install/946600964'
    });
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(sallaEasyModeService.createConnection).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
    expect(sallaOAuthService.createAuthUrl).not.toHaveBeenCalled();
  });

  it('returns a replacement Easy Mode code for reconnect without setting a cookie', async () => {
    const { app, sallaOAuthService, sallaEasyModeService } = createHarness(
      'admin', storeIntegration('pending'), 'easy'
    );

    const response = await request(app)
      .post('/api/integrations/salla/integration-1/reconnect')
      .expect(200);

    expect(response.body.pairingCode).toBe('new-pair-code');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(sallaEasyModeService.reconnect).toHaveBeenCalledWith({
      tenantId: 'tenant-1', integrationId: 'integration-1'
    });
    expect(sallaOAuthService.reconnect).not.toHaveBeenCalled();
  });

  it('sets the same browser-binding cookie for reconnect and marks it Secure in production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const { app } = createHarness('admin', storeIntegration('active'));
    process.env.NODE_ENV = 'production';
    try {
      const response = await request(app).post('/api/integrations/salla/integration-1/reconnect').expect(200);
      expect(response.headers['set-cookie']).toEqual([
        `salla_oauth_verifier=${verifier('reconnect-state')}; Max-Age=600; Path=/api/oauth/salla/callback; HttpOnly; SameSite=Lax; Secure`
      ]);
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('blocks reserved Store types on generic integration creation', async () => {
    const { app, integrationService } = createHarness();

    await request(app).post('/api/integrations').send({ type: 'store_salla', name: 'Fake', credentials: '{}' }).expect(400, {
      error: 'Store integrations must use provider authorization', code: 'RESERVED_INTEGRATION_TYPE'
    });
    expect(integrationService.upsertIntegration).not.toHaveBeenCalled();
  });

  it('requires integrations.manage for generic integration deletion', async () => {
    const { app, prisma } = createHarness('agent', { id: 'generic-1', tenantId: 'tenant-1', type: 'notion' });

    await request(app).delete('/api/integrations/generic-1').expect(403);
    expect(prisma.integration.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects Store rows on generic deletion so the provider route is mandatory', async () => {
    const { app, prisma } = createHarness('admin', storeIntegration('active'));

    await request(app).delete('/api/integrations/integration-1').expect(400, {
      error: 'Store integrations must use provider deletion', code: 'RESERVED_INTEGRATION_TYPE'
    });
    expect(prisma.integration.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes a tenant-owned non-Store integration through the generic route', async () => {
    const generic = { id: 'generic-1', tenantId: 'tenant-1', type: 'notion' };
    const { app, prisma } = createHarness('admin', generic);
    prisma.integration.deleteMany.mockResolvedValue({ count: 1 });

    await request(app).delete('/api/integrations/generic-1').expect(200, { success: true });
    expect(prisma.integration.deleteMany).toHaveBeenCalledWith({
      where: { id: 'generic-1', tenantId: 'tenant-1', type: 'notion' }
    });
  });

  it('does not enqueue a sync for an ID outside the tenant-owned Salla scope', async () => {
    const { app, prisma, storeSync } = createHarness();

    await request(app).post('/api/integrations/salla/other-tenant/sync').expect(404, { error: 'STORE_INTEGRATION_NOT_FOUND' });
    expect(prisma.integration.findFirst).toHaveBeenCalledWith({ where: { id: 'other-tenant', tenantId: 'tenant-1', type: 'store_salla' } });
    expect(storeSync.enqueueFullSync).not.toHaveBeenCalled();
  });

  it('activates an errored integration before enqueuing sync work', async () => {
    const integration = storeIntegration('error');
    const { app, prisma, storeSync } = createHarness('admin', integration);
    storeSync.enqueueFullSync.mockImplementation(async () => {
      expect(integration.status).toBe('active');
    });

    await request(app).post('/api/integrations/salla/integration-1/sync').expect(202, { success: true });
    expect(prisma.integration.updateMany).toHaveBeenCalledWith({
      where: { id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'error' }, data: { status: 'active' }
    });
  });

  it('restores error status when enqueueing a manually activated sync fails', async () => {
    const integration = storeIntegration('error');
    const { app, prisma, storeSync } = createHarness('admin', integration);
    storeSync.enqueueFullSync.mockRejectedValue(new Error('redis-secret'));

    await request(app).post('/api/integrations/salla/integration-1/sync').expect(503, { error: 'STORE_SYNC_UNAVAILABLE' });
    expect(integration.status).toBe('error');
    expect(prisma.integration.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla', status: 'active' }, data: { status: 'error' }
    });
  });

  it('leaves an already active integration active before enqueueing', async () => {
    const integration = storeIntegration('active');
    const { app, prisma } = createHarness('admin', integration);

    await request(app).post('/api/integrations/salla/integration-1/sync').expect(202, { success: true });
    expect(prisma.integration.updateMany).not.toHaveBeenCalled();
  });

  it('requires the browser verifier before invoking the Salla callback service and clears it', async () => {
    const { app, sallaOAuthService } = createHarness();

    await request(app).get('/api/oauth/salla/callback?code=code&state=state')
      .expect(302).expect('Location', '/settings/integrations?error=SALLA_INVALID_STATE');
    await request(app).get('/api/oauth/salla/callback?code=code&state=state')
      .set('Cookie', 'salla_oauth_verifier=mismatch')
      .expect(302).expect('Location', '/settings/integrations?error=SALLA_INVALID_STATE');
    expect(sallaOAuthService.completeCallback).not.toHaveBeenCalled();

    const response = await request(app).get('/api/oauth/salla/callback?code=code&state=state&scope=products.read%20offline_access')
      .set('Cookie', `other=value; salla_oauth_verifier=${verifier('state')}`)
      .expect(302).expect('Location', '/settings/integrations?success=true');
    expect(response.headers['set-cookie']).toEqual([
      'salla_oauth_verifier=; Max-Age=0; Path=/api/oauth/salla/callback; HttpOnly; SameSite=Lax'
    ]);
    expect(sallaOAuthService.completeCallback).toHaveBeenCalledWith({
      code: 'code', state: 'state', grantedScope: 'products.read offline_access'
    });

    sallaOAuthService.completeCallback.mockRejectedValue(Object.assign(new Error('secret'), { code: 'SALLA_INVALID_STATE' }));
    await request(app).get('/api/oauth/salla/callback?code=code&state=state')
      .set('Cookie', `salla_oauth_verifier=${verifier('state')}`)
      .expect(302).expect('Location', '/settings/integrations?error=SALLA_INVALID_STATE');
  });

  it('keeps the OAuth callback public when protected routes are mounted at /api', async () => {
    const sallaOAuthService = {
      completeCallback: vi.fn(async () => ({ id: 'integration-1' }))
    };
    const app = createApp({
      routes: { oauth: oauthRouter, commentReplies: express.Router() },
      middleware: {
        tenantContext: (req, res) => res.status(401).json({ error: 'No token provided' })
      },
      dependencies: { sallaOAuthService }
    });
    const state = 'public-callback-state';

    await request(app)
      .get(`/api/oauth/salla/callback?code=authorization-code&state=${state}&scope=products.read%20offline_access`)
      .set('Cookie', `salla_oauth_verifier=${verifier(state)}`)
      .expect(302)
      .expect('Location', '/settings/integrations?success=true');
    expect(sallaOAuthService.completeCallback).toHaveBeenCalledWith({
      code: 'authorization-code', state, grantedScope: 'products.read offline_access'
    });
  });

  it('redirects Google and Notion OAuth errors to settings', async () => {
    const { app } = createHarness();

    await request(app).get('/api/oauth/google/callback?error=access_denied')
      .expect(302).expect('Location', '/settings/integrations?error=access_denied');
    await request(app).get('/api/oauth/notion/callback?error=access_denied')
      .expect(302).expect('Location', '/settings/integrations?error=access_denied');
  });
});
