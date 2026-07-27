const crypto = require('crypto');
const express = require('express');
const request = require('supertest');
const { createApp } = require('../../../src/app');

const controllerPath = require.resolve('../../../src/controllers/metaWebhookController');
const genericWebhookControllerPath = require.resolve('../../../src/controllers/webhookController');
const routePath = require.resolve('../../../src/routes/webhooks');

function loadWebhookApp(handleMetaWebhook) {
  delete require.cache[routePath];
  require.cache[controllerPath] = {
    id: controllerPath,
    filename: controllerPath,
    loaded: true,
    exports: {
      verifyWebhook: (req, res) => res.sendStatus(204),
      handleMetaWebhook
    }
  };
  require.cache[genericWebhookControllerPath] = {
    id: genericWebhookControllerPath,
    filename: genericWebhookControllerPath,
    loaded: true,
    exports: { handleIncomingMessage: (req, res) => res.sendStatus(204) }
  };
  return createApp({
    routes: {
      webhooks: require(routePath),
      commentReplies: express.Router()
    },
    middleware: {
      tenantContext: (req, res) => res.status(401).json({ error: 'No token provided' })
    }
  });
}

describe('Meta webhook route security', () => {
  const originalSecret = process.env.META_APP_SECRET;

  beforeEach(() => {
    process.env.META_APP_SECRET = 'meta-route-secret';
  });

  afterEach(() => {
    delete require.cache[routePath];
    delete require.cache[controllerPath];
    delete require.cache[genericWebhookControllerPath];
    if (originalSecret === undefined) delete process.env.META_APP_SECRET;
    else process.env.META_APP_SECRET = originalSecret;
  });

  it('rejects an invalid signature before invoking the Meta handler', async () => {
    const handler = vi.fn((req, res) => res.sendStatus(204));
    const app = loadWebhookApp(handler);

    await request(app)
      .post('/api/webhooks/meta')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', 'sha256=invalid')
      .send('{"object":"page"}')
      .expect(401, { error: 'INVALID_META_SIGNATURE' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('passes valid signed raw JSON to the Meta handler', async () => {
    const handler = vi.fn((req, res) => res.status(204).end());
    const app = loadWebhookApp(handler);
    const body = '{"object":"page","entry":[]}';
    const signature = `sha256=${crypto.createHmac('sha256', process.env.META_APP_SECRET).update(body).digest('hex')}`;

    await request(app)
      .post('/api/webhooks/meta')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', signature)
      .send(body)
      .expect(204);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      body: { object: 'page', entry: [] },
      metaWebhookVerified: true
    }), expect.anything(), expect.anything());
  });
});
