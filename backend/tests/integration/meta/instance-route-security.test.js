const express = require('express');
const request = require('supertest');
const axios = require('axios');

const databasePath = require.resolve('../../../src/config/database');
const planLimitPath = require.resolve('../../../src/services/planLimit.service');
const channelConfigPath = require.resolve('../../../src/services/channelConfig.service');
const routePath = require.resolve('../../../src/routes/instances');
const originalDatabase = require(databasePath);
const originalPlanLimit = require(planLimitPath);
const originalChannelConfig = require(channelConfigPath);

function loadInstancesApp(prisma) {
  delete require.cache[routePath];
  delete require.cache[channelConfigPath];
  require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: prisma };
  require.cache[planLimitPath] = {
    id: planLimitPath,
    filename: planLimitPath,
    loaded: true,
    exports: { ...originalPlanLimit, resolveTenantPlanByTenantId: vi.fn().mockResolvedValue({ plan: null }) }
  };

  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.tenantId = 'tenant-1';
    req.user = { id: 'user-1', role: 'owner', tenantId: 'tenant-1' };
    next();
  });
  app.use('/api/instances', require(routePath));
  return app;
}

describe('Instance route token boundary', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    delete require.cache[routePath];
    require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: originalDatabase };
    require.cache[planLimitPath] = { id: planLimitPath, filename: planLimitPath, loaded: true, exports: originalPlanLimit };
    require.cache[channelConfigPath] = { id: channelConfigPath, filename: channelConfigPath, loaded: true, exports: originalChannelConfig };
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  it('encrypts Meta writes and omits stored tokens from create and list responses', async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 4).toString('base64');
    const stored = { id: 'instance-1', instanceName: 'Cloud', channelType: 'whatsapp_cloud', accessToken: 'meta:v1:stored' };
    const prisma = {
      instance: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn(),
        create: vi.fn().mockImplementation(async ({ data }) => ({ ...stored, ...data })),
        findMany: vi.fn().mockResolvedValue([stored])
      }
    };
    const app = loadInstancesApp(prisma);

    const create = await request(app)
      .post('/api/instances')
      .send({ instanceName: 'Cloud', channelType: 'whatsapp_cloud', phoneNumberId: 'phone-1', accessToken: 'plain-meta-token' })
      .expect(201);
    const persistedToken = prisma.instance.create.mock.calls[0][0].data.accessToken;

    expect(persistedToken).toMatch(/^meta:v1:/);
    expect(persistedToken).not.toContain('plain-meta-token');
    expect(create.body.instance).not.toHaveProperty('accessToken');

    const list = await request(app).get('/api/instances').expect(200);
    expect(list.body.instances[0]).not.toHaveProperty('accessToken');
  });

  it('subscribes Instagram through the linked page without dropping Facebook feed events', async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 5).toString('base64');
    const prisma = {
      instance: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'instagram-1', ...data }))
      },
      integration: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'config-1' })
      },
      commentChannelBinding: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 })
      }
    };
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: {
        data: [{
          id: 'page-1',
          name: 'Brand Page',
          access_token: 'page-access-token',
          instagram_business_account: { id: 'instagram-account-1', username: 'brand' }
        }]
      }
    });
    const subscribe = vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true } });
    const app = loadInstancesApp(prisma);

    await request(app)
      .post('/api/instances/meta/embedded')
      .send({ channelType: 'instagram', userAccessToken: 'user-access-token' })
      .expect(201);

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith(
      expect.stringContaining('/page-1/subscribed_apps'),
      null,
      expect.objectContaining({
        params: expect.objectContaining({
          subscribed_fields: expect.stringContaining('feed'),
          access_token: 'page-access-token'
        })
      })
    );
    expect(subscribe.mock.calls[0][0]).not.toContain('instagram-account-1');
  });
});
