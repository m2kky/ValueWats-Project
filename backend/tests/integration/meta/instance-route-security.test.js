const express = require('express');
const request = require('supertest');

const databasePath = require.resolve('../../../src/config/database');
const planLimitPath = require.resolve('../../../src/services/planLimit.service');
const routePath = require.resolve('../../../src/routes/instances');
const originalDatabase = require(databasePath);
const originalPlanLimit = require(planLimitPath);

function loadInstancesApp(prisma) {
  delete require.cache[routePath];
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
});
