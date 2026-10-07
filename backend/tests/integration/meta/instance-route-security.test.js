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
const grantedInstagramCommentPermissions = ['instagram_manage_comments', 'pages_manage_metadata', 'pages_show_list']
  .map((permission) => ({ permission, status: 'granted' }));

function loadInstancesApp(prisma, plan = null) {
  delete require.cache[routePath];
  delete require.cache[channelConfigPath];
  require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: prisma };
  require.cache[planLimitPath] = {
    id: planLimitPath,
    filename: planLimitPath,
    loaded: true,
    exports: { ...originalPlanLimit, resolveTenantPlanByTenantId: vi.fn().mockResolvedValue({ plan }) }
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

function loadPageSubscriptionFixture(initialFields = []) {
  const instances = [];
  const subscription = { fields: new Set(initialFields) };
  const prisma = {
    instance: {
      count: vi.fn().mockImplementation(async () => instances.length),
      findFirst: vi.fn().mockImplementation(async ({ where }) => instances.find((instance) => (
        Object.entries(where).every(([key, value]) => value?.not === null
          ? instance[key] != null : instance[key] === value)
      )) || null),
      create: vi.fn().mockImplementation(async ({ data }) => {
        const instance = { id: `instance-${data.channelType}`, primaryAgentId: null, ...data };
        instances.push(instance);
        return instance;
      }),
      update: vi.fn().mockImplementation(async ({ where, data }) => {
        const instance = instances.find((item) => item.id === where.id);
        Object.assign(instance, data);
        return instance;
      })
    },
    integration: {
      findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'config-1' })
    },
    commentChannelBinding: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) }
  };
  axios.get.mockReset().mockImplementation(async (url) => {
    if (url.endsWith('/oauth/access_token')) return { data: { access_token: 'durable-user-token' } };
    if (url.endsWith('/me/accounts')) return { data: { data: [{
      id: 'page-1', name: 'NASA', access_token: 'page-token',
      instagram_business_account: { id: 'instagram-account-1', username: 'nasa' }
    }] } };
    if (url.endsWith('/me/permissions')) return { data: { data: grantedInstagramCommentPermissions } };
    if (url.endsWith('/page-1/subscribed_apps')) return { data: { data: [
      { id: 'meta-app-id', subscribed_fields: [...subscription.fields] },
      { id: 'unrelated-app', subscribed_fields: ['leadgen'] }
    ] } };
    throw new Error(`Unexpected Meta GET ${url}`);
  });
  vi.spyOn(axios, 'post').mockImplementation(async (url, body, { params }) => {
    if (!url.endsWith('/page-1/subscribed_apps')) throw new Error(`Unexpected Meta POST ${url}`);
    // Model the Page API's replacement of this app's complete field selection.
    subscription.fields = new Set(params.subscribed_fields.split(','));
    return { data: { success: true } };
  });
  return { app: loadInstancesApp(prisma), subscription };
}

describe('Instance route token boundary', () => {
  const originalKey = process.env.ENCRYPTION_KEY;
  const originalMetaAppId = process.env.META_APP_ID;
  const originalMetaAppSecret = process.env.META_APP_SECRET;

  beforeEach(() => {
    process.env.META_APP_ID = 'meta-app-id';
    process.env.META_APP_SECRET = 'meta-app-secret';
    vi.spyOn(axios, 'get').mockImplementation(async (url) => {
      if (url.endsWith('/me/permissions')) return { data: { data: grantedInstagramCommentPermissions } };
      if (url.endsWith('/subscribed_apps')) return { data: { data: [] } };
      throw new Error(`Unexpected Meta GET ${url}`);
    });
  });

  afterEach(() => {
    delete require.cache[routePath];
    require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: originalDatabase };
    require.cache[planLimitPath] = { id: planLimitPath, filename: planLimitPath, loaded: true, exports: originalPlanLimit };
    require.cache[channelConfigPath] = { id: channelConfigPath, filename: channelConfigPath, loaded: true, exports: originalChannelConfig };
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
    if (originalMetaAppId === undefined) delete process.env.META_APP_ID;
    else process.env.META_APP_ID = originalMetaAppId;
    if (originalMetaAppSecret === undefined) delete process.env.META_APP_SECRET;
    else process.env.META_APP_SECRET = originalMetaAppSecret;
  });

  it('exchanges Facebook Login credentials before requesting a durable Page token', async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    process.env.META_APP_ID = 'meta-app-id';
    process.env.META_APP_SECRET = 'meta-app-secret';
    const prisma = {
      instance: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'messenger-1', ...data }))
      },
      integration: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'config-1' })
      },
      commentChannelBinding: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 })
      }
    };
    const get = vi.spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: { access_token: 'long-lived-user-token' } })
      .mockResolvedValueOnce({
        data: {
          data: [{
            id: 'page-1',
            name: 'NASA International Schools',
            access_token: 'durable-page-token'
          }]
        }
      });
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true } });
    const app = loadInstancesApp(prisma);

    await request(app)
      .post('/api/instances/meta/embedded')
      .send({ channelType: 'messenger', userAccessToken: 'short-lived-user-token' })
      .expect(201);

    expect(get).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/oauth/access_token'),
      expect.objectContaining({
        params: {
          grant_type: 'fb_exchange_token',
          client_id: 'meta-app-id',
          client_secret: 'meta-app-secret',
          fb_exchange_token: 'short-lived-user-token'
        }
      })
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/me/accounts'),
      expect.objectContaining({
        params: expect.objectContaining({ access_token: 'long-lived-user-token' })
      })
    );
  });

  it('paginates Meta pages so later Instagram accounts remain selectable', async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 8).toString('base64');
    const prisma = {
      instance: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };
    const get = vi.spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: { access_token: 'long-lived-user-token' } })
      .mockResolvedValueOnce({
        data: {
          data: [{
            id: 'page-1',
            name: 'First Page',
            access_token: 'page-token-1',
            instagram_business_account: { id: 'instagram-1', username: 'first' }
          }],
          paging: { cursors: { after: 'next-page-cursor' }, next: 'https://graph.facebook.com/next' }
        }
      })
      .mockResolvedValueOnce({
        data: {
          data: [{
            id: 'greens-page',
            name: 'Greens.us',
            access_token: 'greens-page-token',
            instagram_business_account: { id: 'greens-instagram', username: 'greens.us' }
          }]
        }
      });
    const app = loadInstancesApp(prisma);

    const response = await request(app)
      .post('/api/instances/meta/embedded')
      .send({ channelType: 'instagram', userAccessToken: 'short-lived-user-token' })
      .expect(409);

    expect(response.body.pages).toEqual(expect.arrayContaining([
      expect.objectContaining({ pageId: 'greens-page', instagramId: 'greens-instagram' })
    ]));
    expect(get).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/me/accounts'),
      expect.objectContaining({
        params: expect.objectContaining({ after: 'next-page-cursor' })
      })
    );
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

  it('enables Instagram webhooks through the linked Page for Facebook Login', async () => {
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
    vi.spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: { access_token: 'long-lived-user-token' } })
      .mockResolvedValueOnce({
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

    const response = await request(app)
      .post('/api/instances/meta/embedded')
      .send({ channelType: 'instagram', userAccessToken: 'user-access-token' })
      .expect(201);

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith(
      expect.stringContaining('/page-1/subscribed_apps'),
      null,
      expect.objectContaining({
        params: expect.objectContaining({
          subscribed_fields: 'feed',
          access_token: 'page-access-token'
        })
      })
    );
    expect(response.body.commentPermissionsReady).toBe(true);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/me/permissions'),
      expect.objectContaining({ params: { access_token: 'long-lived-user-token' } })
    );
    expect(prisma.commentChannelBinding.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ permissionState: 'ready' })
    }));
  });

  it.each([
    ['messenger', 'instagram'], ['instagram', 'messenger']
  ])('preserves messages and comments when connecting %s then %s and reconnecting both', async (first, second) => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 11).toString('base64');
    const { app, subscription } = loadPageSubscriptionFixture();
    for (const channelType of [first, second]) {
      await request(app).post('/api/instances/meta/embedded')
        .send({ channelType, userAccessToken: 'login-token' }).expect(201);
    }
    for (const channelType of [first, second]) {
      await request(app).post('/api/instances/meta/embedded')
        .send({ channelType, userAccessToken: 'login-token', reconnectInstanceId: `instance-${channelType}` })
        .expect(200);
      expect(subscription.fields.has('messages')).toBe(true);
      expect(subscription.fields.has('messaging_postbacks')).toBe(true);
      expect(subscription.fields.has('message_reads')).toBe(true);
      expect(subscription.fields.has('message_deliveries')).toBe(true);
      expect(subscription.fields.has('feed')).toBe(true);
      expect(subscription.fields.has('leadgen')).toBe(false);
    }
  });

  it.each(['instagram', 'messenger'])('preserves existing custom fields for this app during %s signup', async (channelType) => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 11).toString('base64');
    const { app, subscription } = loadPageSubscriptionFixture(['message_reactions']);
    await request(app).post('/api/instances/meta/embedded')
      .send({ channelType, userAccessToken: 'login-token' }).expect(201);
    expect(subscription.fields.has('message_reactions')).toBe(true);
    expect(subscription.fields.has('feed')).toBe(true);
    expect(subscription.fields.has('leadgen')).toBe(false);
  });

  it('does not rewrite an existing shared Page subscription using an Instagram-only login', async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 11).toString('base64');
    const { app, subscription } = loadPageSubscriptionFixture(['messages', 'feed']);
    const response = await request(app).post('/api/instances/meta/embedded')
      .send({ channelType: 'instagram', userAccessToken: 'instagram-login-token' }).expect(201);
    expect(response.body.commentPermissionsReady).toBe(true);
    expect(subscription.fields.has('messages')).toBe(true);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('finds this app on later subscription pages before changing its field selection', async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 11).toString('base64');
    const { app, subscription } = loadPageSubscriptionFixture(['messages', 'message_reactions']);
    const originalGet = axios.get.getMockImplementation();
    axios.get.mockImplementation(async (url, options) => {
      if (url.endsWith('/subscribed_apps') && !options.params.after) return { data: {
        data: [{ id: 'unrelated-app', subscribed_fields: ['leadgen'] }],
        paging: { next: 'https://graph.facebook.com/next', cursors: { after: 'second-page' } }
      } };
      return originalGet(url, options);
    });
    await request(app).post('/api/instances/meta/embedded')
      .send({ channelType: 'instagram', userAccessToken: 'login-token' }).expect(201);
    expect(subscription.fields.has('messages')).toBe(true);
    expect(subscription.fields.has('message_reactions')).toBe(true);
    expect(subscription.fields.has('feed')).toBe(true);
    expect(subscription.fields.has('leadgen')).toBe(false);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/subscribed_apps'), expect.objectContaining({
      params: expect.objectContaining({ after: 'second-page' })
    }));
  });

  it.each([
    { error: { response: { status: 503 }, message: 'Unavailable' } },
    { body: { error: { message: 'Malformed result' } } },
    { body: { data: [{ id: 'meta-app-id' }] } },
    { body: { data: [], paging: { next: 'https://graph.facebook.com/next' } } }
  ])('leaves the shared subscription untouched if its existing fields cannot be read %#', async ({ error, body }) => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 11).toString('base64');
    const { app, subscription } = loadPageSubscriptionFixture(['messages', 'feed']);
    const originalGet = axios.get.getMockImplementation();
    axios.get.mockImplementation(async (url, options) => {
      if (url.endsWith('/subscribed_apps')) {
        if (error) throw error;
        return { data: body };
      }
      return originalGet(url, options);
    });
    const response = await request(app).post('/api/instances/meta/embedded')
      .send({ channelType: 'instagram', userAccessToken: 'login-token' }).expect(201);
    expect(response.body.commentPermissionsReady).toBe(false);
    expect(subscription.fields.has('messages')).toBe(true);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('inherits the linked Page Primary Agent when reconnecting Instagram', async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');
    const existingInstagram = {
      id: 'instagram-1',
      tenantId: 'tenant-1',
      channelType: 'instagram',
      phoneNumberId: 'instagram-account-1',
      phoneNumber: 'page-1',
      primaryAgentId: null
    };
    const prisma = {
      instance: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn()
          .mockResolvedValueOnce(existingInstagram)
          .mockResolvedValueOnce({
            primaryAgentId: 'agent-greens',
            primaryAgent: {
              id: 'agent-greens', isActive: true, isPublished: true, deletedAt: null
            }
          }),
        update: vi.fn().mockImplementation(async ({ data }) => ({ ...existingInstagram, ...data }))
      },
      integration: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'config-1' })
      },
      commentChannelBinding: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 })
      }
    };
    vi.spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: { access_token: 'long-lived-user-token' } })
      .mockResolvedValueOnce({
        data: {
          data: [{
            id: 'page-1',
            name: 'Greens Page',
            access_token: 'page-access-token',
            instagram_business_account: { id: 'instagram-account-1', username: 'greens' }
          }]
        }
      });
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true } });
    const app = loadInstancesApp(prisma);

    const response = await request(app)
      .post('/api/instances/meta/embedded')
      .send({ channelType: 'instagram', userAccessToken: 'user-access-token' })
      .expect(200);

    expect(prisma.instance.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'instagram-1' },
      data: expect.objectContaining({ primaryAgentId: 'agent-greens' })
    }));
    expect(response.body.instance.primaryAgentId).toBe('agent-greens');
  });

  it('connects a selected Messenger page directly when /me/accounts omits it', async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 6).toString('base64');
    const prisma = {
      instance: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'messenger-1', ...data }))
      },
      integration: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'config-1' })
      },
      commentChannelBinding: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 })
      }
    };
    const get = vi.spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: { access_token: 'long-lived-user-token' } })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({
        data: {
          id: '359509670571259',
          name: 'NASA International Schools',
          access_token: 'nasa-page-access-token'
        }
      });
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true } });
    const app = loadInstancesApp(prisma);

    const response = await request(app)
      .post('/api/instances/meta/embedded')
      .send({
        channelType: 'messenger',
        userAccessToken: 'user-access-token',
        selectedPageId: '359509670571259',
        instanceName: 'NASA Messenger'
      })
      .expect(201);

    expect(get).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/359509670571259'),
      expect.objectContaining({
        params: expect.objectContaining({ access_token: 'long-lived-user-token' })
      })
    );
    expect(response.body.connectedAsset).toMatchObject({
      pageId: '359509670571259',
      pageName: 'NASA International Schools'
    });
  });

  describe('explicit channel reconnect', () => {
    let instance;
    let prisma;

    beforeEach(() => {
      process.env.ENCRYPTION_KEY = Buffer.alloc(32, 10).toString('base64');
      instance = {
        id: 'instagram-1', tenantId: 'tenant-1', channelType: 'instagram',
        instanceName: 'NASA Instagram', phoneNumberId: 'instagram-account-1', phoneNumber: 'page-1',
        primaryAgentId: 'agent-1', status: 'disconnected', accessToken: 'old-token'
      };
      prisma = {
        instance: {
          count: vi.fn().mockResolvedValue(1),
          findFirst: vi.fn().mockImplementation(async ({ where }) => (
            where.tenantId === instance.tenantId && (where.id === instance.id || (
              where.channelType === instance.channelType && where.phoneNumberId === instance.phoneNumberId
            )) ? instance : null
          )),
          update: vi.fn().mockImplementation(async ({ data }) => ({ ...instance, ...data })),
          create: vi.fn()
        },
        integration: {
          findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'config-1' })
        },
        commentChannelBinding: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) }
      };
      vi.spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: { access_token: 'fresh-durable-token' } })
        .mockResolvedValueOnce({ data: { data: [{
          id: 'page-1', name: 'NASA', access_token: 'fresh-page-token',
          instagram_business_account: { id: 'instagram-account-1', username: 'nasa' }
        }] } });
      vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true } });
    });

    it.each(['instagram', 'messenger'])('refreshes the same %s channel at the plan limit', async (channelType) => {
      instance.channelType = channelType;
      if (channelType === 'messenger') instance.phoneNumberId = 'page-1';
      const response = await request(loadInstancesApp(prisma, { maxInstances: 1 }))
        .post('/api/instances/meta/embedded')
        .send({ channelType, reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);

      expect(response.body.instance).toMatchObject({
        id: instance.id, instanceName: 'NASA Instagram', primaryAgentId: 'agent-1', status: 'connected'
      });
      expect(response.body.instance).not.toHaveProperty('accessToken');
      expect(response.body.commentPermissionsReady).toBe(true);
      expect(prisma.instance.create).not.toHaveBeenCalled();
      expect(prisma.instance.count).not.toHaveBeenCalled();
      expect(prisma.instance.update.mock.calls[0][0].data.accessToken).toMatch(/^meta:v1:/);
      expect(prisma.commentChannelBinding.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: 'tenant-1', instanceId: instance.id }, data: expect.objectContaining({ permissionState: 'ready' })
      }));
    });

    it('keeps a paused channel paused while refreshing its credentials', async () => {
      instance.status = 'disabled';
      const response = await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(response.body.instance.status).toBe('disabled');
    });

    it('also renews a matching account from the regular connect flow at the plan limit', async () => {
      await request(loadInstancesApp(prisma, { maxInstances: 1 }))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(prisma.instance.create).not.toHaveBeenCalled();
      expect(prisma.instance.count).not.toHaveBeenCalled();
    });

    it('finds a legacy Instagram channel by its account ID when its Page ID is missing', async () => {
      instance.phoneNumber = null;
      await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(prisma.instance.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: instance.id }, data: expect.objectContaining({ phoneNumber: 'page-1' })
      }));
    });

    it('does not replace an unassigned Primary Agent during explicit reconnect', async () => {
      instance.primaryAgentId = null;
      await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(prisma.instance.update.mock.calls[0][0].data).not.toHaveProperty('primaryAgentId');
    });

    it('rejects a missing or cross-tenant target before requesting Meta credentials', async () => {
      await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: 'another-channel', userAccessToken: 'fresh-login-token' })
        .expect(404);
      expect(prisma.instance.findFirst).toHaveBeenCalledWith({ where: { id: 'another-channel', tenantId: 'tenant-1' } });
      expect(axios.get).not.toHaveBeenCalled();
      expect(prisma.instance.create).not.toHaveBeenCalled();
    });

    it('rejects reconnecting a channel through the wrong platform', async () => {
      await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'messenger', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(400);
      expect(axios.get).not.toHaveBeenCalled();
      expect(prisma.instance.create).not.toHaveBeenCalled();
    });

    it('refuses to replace the original Instagram account with a different account', async () => {
      instance.phoneNumberId = 'original-instagram-account';
      await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(409)
        .expect(({ body }) => expect(body.code).toBe('META_RECONNECT_ACCOUNT_MISMATCH'));
      expect(prisma.instance.update).not.toHaveBeenCalled();
      expect(prisma.instance.create).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('reports incomplete comment permissions when webhook subscription fails', async () => {
      axios.post.mockRejectedValue({ response: { status: 403 }, message: 'Permission denied' });
      const response = await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(response.body.commentPermissionsReady).toBe(false);
      expect(prisma.commentChannelBinding.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ permissionState: 'reconnect_required' })
      }));
    });

    it.each(['declined', 'expired', 'missing'])('keeps comments blocked when the Instagram comment grant is %s', async (status) => {
      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      axios.get.mockResolvedValueOnce({ data: { data: grantedInstagramCommentPermissions
        .filter(({ permission }) => permission !== 'instagram_manage_comments')
        .concat(status === 'missing' ? [] : [{ permission: 'instagram_manage_comments', status }]) } });
      const response = await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(response.body.commentPermissionsReady).toBe(false);
      expect(prisma.commentChannelBinding.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ permissionState: 'reconnect_required' })
      }));
    });

    it('accepts pages_read_engagement as the documented alternative to pages_show_list', async () => {
      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      axios.get.mockResolvedValueOnce({ data: { data: grantedInstagramCommentPermissions
        .map((grant) => ({ ...grant, permission: grant.permission === 'pages_show_list' ? 'pages_read_engagement' : grant.permission })) } });
      const response = await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(response.body.commentPermissionsReady).toBe(true);
    });

    it('keeps comments blocked if Meta cannot verify the granted permissions', async () => {
      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      axios.get.mockRejectedValueOnce({ response: { status: 503 }, message: 'Meta unavailable' });
      const response = await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(response.body.commentPermissionsReady).toBe(false);
    });

    it('requires Meta to confirm subscription success even for an HTTP 200 response', async () => {
      axios.post.mockResolvedValue({ data: { success: false } });
      const response = await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(response.body.commentPermissionsReady).toBe(false);
    });

    it('logs useful Meta failure details without exposing credentials or unrelated response data', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      axios.post.mockRejectedValue({
        code: 'ERR_BAD_REQUEST', message: 'Request failed with status code 400',
        config: { params: { access_token: 'fresh-page-token' } },
        response: { status: 400, data: {
          error: { code: 190, error_subcode: 463, message: 'Expired credential fresh-page-token; access_token=other-secret' },
          access_token: 'response-secret'
        } }
      });
      await request(loadInstancesApp(prisma))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', reconnectInstanceId: instance.id, userAccessToken: 'fresh-login-token' })
        .expect(200);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Meta] Failed to subscribe'), expect.objectContaining({
        status: 400, graphCode: 190, graphSubcode: 463, graphMessage: expect.stringContaining('Expired credential')
      }));
      const output = JSON.stringify(warn.mock.calls);
      expect(output).not.toContain('fresh-page-token');
      expect(output).not.toContain('other-secret');
      expect(output).not.toContain('response-secret');
    });

    it('still enforces the limit when connecting a new channel', async () => {
      prisma.instance.findFirst.mockResolvedValue(null);
      await request(loadInstancesApp(prisma, { maxInstances: 1 }))
        .post('/api/instances/meta/embedded')
        .send({ channelType: 'instagram', userAccessToken: 'fresh-login-token' })
        .expect(402);
      expect(prisma.instance.create).not.toHaveBeenCalled();
    });
  });

  it('assigns an eligible Primary Agent atomically without exposing the Instance token', async () => {
    const instance = {
      id: 'instance-1',
      tenantId: 'tenant-1',
      channelType: 'messenger',
      instanceName: 'Greens Facebook',
      primaryAgentId: null,
      accessToken: 'meta:v1:secret'
    };
    const agent = {
      id: 'agent-1',
      tenantId: 'tenant-1',
      name: 'Greens Agent',
      isActive: true,
      isPublished: true,
      deletedAt: null
    };
    const prisma = {
      $transaction: vi.fn((operation) => operation(prisma)),
      instance: {
        findFirst: vi.fn().mockResolvedValue(instance),
        update: vi.fn(({ data }) => Promise.resolve({
          ...instance,
          ...data,
          primaryAgent: agent
        }))
      },
      aIAgent: { findFirst: vi.fn().mockResolvedValue(agent) },
      commentReplyProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'profile-1',
          tenantId: 'tenant-1',
          agentId: 'agent-1'
        }),
        create: vi.fn(),
        updateMany: vi.fn()
      },
      commentChannelBinding: { findFirst: vi.fn().mockResolvedValue(null) }
    };
    const app = loadInstancesApp(prisma);

    const response = await request(app)
      .put('/api/instances/instance-1/primary-agent')
      .send({ primaryAgentId: 'agent-1' })
      .expect(200);

    expect(response.body.instance).toMatchObject({
      id: 'instance-1',
      primaryAgentId: 'agent-1',
      primaryAgent: { id: 'agent-1', name: 'Greens Agent' }
    });
    expect(response.body.instance).not.toHaveProperty('accessToken');
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('returns stable routing errors without mutating a cross-tenant or missing Instance', async () => {
    const prisma = {
      $transaction: vi.fn((operation) => operation(prisma)),
      instance: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
      aIAgent: { findFirst: vi.fn() },
      commentReplyProfile: {},
      commentChannelBinding: {}
    };
    const app = loadInstancesApp(prisma);

    await request(app)
      .put('/api/instances/instance-other/primary-agent')
      .send({ primaryAgentId: 'agent-1' })
      .expect(404)
      .expect(({ body }) => expect(body.code).toBe('PAGE_AGENT_ROUTING_INSTANCE_NOT_FOUND'));

    expect(prisma.instance.update).not.toHaveBeenCalled();
  });
});
