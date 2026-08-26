const crypto = require('crypto');
const request = require('supertest');
const { createApp } = require('../../../src/app');
const { createSallaWebhookRouter } = require('../../../src/stores/providers/salla/sallaWebhook.routes');

const secret = 'salla-route-secret';
const refreshEvents = [
  'product.created',
  'product.price.updated',
  'product.status.updated',
  'product.image.updated',
  'product.category.updated',
  'product.brand.updated',
  'product.tags.updated',
  'product.quantity.low'
];

function createHarness() {
  const integration = {
    id: 'integration-1', tenantId: 'tenant-1', type: 'store_salla',
    externalAccountId: '12', status: 'active'
  };
  const prisma = {
    integration: {
      findFirst: vi.fn().mockResolvedValue(integration),
      update: vi.fn().mockResolvedValue({ ...integration, status: 'revoked' })
    }
  };
  const queue = {
    enqueueProductRefresh: vi.fn().mockResolvedValue({ id: 'refresh-job' }),
    enqueueDelete: vi.fn().mockResolvedValue({ id: 'delete-job' })
  };
  const app = createApp({
    routes: { sallaWebhooks: createSallaWebhookRouter },
    dependencies: { prisma, queues: { storeSync: queue }, sallaWebhookSecret: secret }
  });
  return { app, prisma, queue };
}

function signedRequest(app, body, signatureBody = body) {
  const signature = crypto.createHmac('sha256', secret).update(signatureBody).digest('hex');
  return request(app)
    .post('/api/webhooks/salla')
    .set('Content-Type', 'application/json')
    .set('X-Salla-Signature', signature)
    .send(body);
}

describe('Salla webhook route', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects invalid signatures before parsing, resolving, or enqueueing', async () => {
    const { app, prisma, queue } = createHarness();

    await request(app)
      .post('/api/webhooks/salla')
      .set('Content-Type', 'application/json')
      .set('X-Salla-Signature', 'invalid')
      .send('{"event":"product.price.updated","merchant":12}')
      .expect(401, { error: 'INVALID_SALLA_SIGNATURE' });

    expect(prisma.integration.findFirst).not.toHaveBeenCalled();
    expect(queue.enqueueProductRefresh).not.toHaveBeenCalled();
  });

  it('passes exact raw bytes to verification and enqueues once', async () => {
    const { app, prisma, queue } = createHarness();
    const body = '{"event":"product.price.updated", "merchant":12,"data":{"id":44}}';

    await signedRequest(app, body).expect(202);

    expect(prisma.integration.findFirst).toHaveBeenCalledWith({
      where: { type: 'store_salla', externalAccountId: '12' }
    });
    expect(queue.enqueueProductRefresh).toHaveBeenCalledOnce();
    expect(queue.enqueueProductRefresh).toHaveBeenCalledWith({
      tenantId: 'tenant-1', integrationId: 'integration-1', merchantId: '12', productId: '44'
    });
  });

  it('rejects a signed malformed body without using it', async () => {
    const { app, prisma, queue } = createHarness();

    await signedRequest(app, '{not-json').expect(400, { error: 'INVALID_SALLA_BODY' });

    expect(prisma.integration.findFirst).not.toHaveBeenCalled();
    expect(queue.enqueueProductRefresh).not.toHaveBeenCalled();
  });

  it.each(refreshEvents)('maps %s to a product refresh', async (event) => {
    const { app, queue } = createHarness();
    const body = JSON.stringify({ event, merchant: 12, data: { id: 44 } });

    await signedRequest(app, body).expect(202);

    expect(queue.enqueueProductRefresh).toHaveBeenCalledOnce();
    expect(queue.enqueueDelete).not.toHaveBeenCalled();
  });

  it('maps product.deleted to a product delete', async () => {
    const { app, queue } = createHarness();
    const body = JSON.stringify({ event: 'product.deleted', merchant: 12, data: { id: 44 } });

    await signedRequest(app, body).expect(202);

    expect(queue.enqueueDelete).toHaveBeenCalledWith({
      tenantId: 'tenant-1', integrationId: 'integration-1', merchantId: '12', productId: '44'
    });
    expect(queue.enqueueProductRefresh).not.toHaveBeenCalled();
  });

  it('revokes only the matching integration on app.uninstalled', async () => {
    const { app, prisma, queue } = createHarness();
    const body = JSON.stringify({ event: 'app.uninstalled', merchant: 12 });

    await signedRequest(app, body).expect(202);

    expect(prisma.integration.update).toHaveBeenCalledWith({
      where: { id: 'integration-1' }, data: { status: 'revoked' }
    });
    expect(queue.enqueueProductRefresh).not.toHaveBeenCalled();
    expect(queue.enqueueDelete).not.toHaveBeenCalled();
  });

  it('acknowledges valid unknown events without resolving or enqueueing', async () => {
    const { app, prisma, queue } = createHarness();
    const body = JSON.stringify({ event: 'order.created', merchant: 12, data: { token: 'payload-secret' } });

    await signedRequest(app, body).expect(202);

    expect(prisma.integration.findFirst).not.toHaveBeenCalled();
    expect(queue.enqueueProductRefresh).not.toHaveBeenCalled();
    expect(queue.enqueueDelete).not.toHaveBeenCalled();
  });

  it('does not enqueue for a different or inactive merchant integration', async () => {
    const { app, prisma, queue } = createHarness();
    prisma.integration.findFirst.mockResolvedValue(null);
    const body = JSON.stringify({ event: 'product.created', merchant: 99, data: { id: 44 } });

    await signedRequest(app, body).expect(202);

    expect(prisma.integration.findFirst).toHaveBeenCalledWith({
      where: { type: 'store_salla', externalAccountId: '99' }
    });
    expect(queue.enqueueProductRefresh).not.toHaveBeenCalled();
  });

  it('returns 503 when enqueue fails so Salla can retry', async () => {
    const { app, queue } = createHarness();
    queue.enqueueProductRefresh.mockRejectedValue(Object.assign(new Error('redis secret details'), { code: 'ECONNREFUSED' }));
    const body = JSON.stringify({ event: 'product.created', merchant: 12, data: { id: 44 } });

    await signedRequest(app, body).expect(503, { error: 'SALLA_WEBHOOK_PROCESSING_FAILED' });
  });

  it('logs metadata only without signatures, payload fields, or provider errors', async () => {
    const { app, queue } = createHarness();
    queue.enqueueProductRefresh.mockRejectedValue(new Error('provider-secret-body'));
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const body = JSON.stringify({ event: 'product.created', merchant: 12, data: { id: 44, token: 'payload-secret' } });

    await signedRequest(app, body).expect(503);

    const captured = JSON.stringify(info.mock.calls);
    expect(captured).toContain('product.created');
    expect(captured).toContain('SALLA_WEBHOOK_PROCESSING_FAILED');
    expect(captured).not.toContain('payload-secret');
    expect(captured).not.toContain('provider-secret-body');
    expect(captured).not.toContain(crypto.createHmac('sha256', secret).update(body).digest('hex'));
  });
});
