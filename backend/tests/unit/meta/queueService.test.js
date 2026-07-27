const bullPath = require.resolve('bull');
const redisPath = require.resolve('../../../src/config/redis');
const evolutionPath = require.resolve('../../../src/services/evolutionApi');
const metaApiPath = require.resolve('../../../src/services/metaApi');
const databasePath = require.resolve('../../../src/config/database');
const socketPath = require.resolve('../../../src/services/socketService');
const queueServicePath = require.resolve('../../../src/services/queueService');

class FakeQueue {
  constructor() {
    this.handlers = {};
    FakeQueue.instance = this;
  }

  process(handler) {
    this.processor = handler;
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  add() {}
}

function mockModule(filename, exports) {
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

function loadQueueService({ prisma, metaApi, emitCampaignProgress }) {
  delete require.cache[queueServicePath];
  mockModule(bullPath, FakeQueue);
  mockModule(redisPath, { get: vi.fn(), set: vi.fn() });
  mockModule(evolutionPath, {});
  mockModule(metaApiPath, metaApi);
  mockModule(databasePath, prisma);
  mockModule(socketPath, { emitCampaignProgress });
  require(queueServicePath);
  return FakeQueue.instance;
}

describe('campaign queue Meta errors', () => {
  afterEach(() => {
    [bullPath, redisPath, evolutionPath, metaApiPath, databasePath, socketPath, queueServicePath]
      .forEach((filename) => delete require.cache[filename]);
    vi.restoreAllMocks();
  });

  it('keeps Meta Axios tokens out of logs, persistence, job errors, and socket payloads', async () => {
    const token = 'queue-meta-secret';
    const providerError = {
      code: 'ERR_BAD_REQUEST',
      message: `Authorization: Bearer ${token}; access_token=${token}`,
      config: {
        headers: { Authorization: `Bearer ${token}` },
        params: { access_token: token }
      },
      response: { data: { error: { message: `access_token=${token}` } } }
    };
    const prisma = {
      message: { update: vi.fn().mockResolvedValue(undefined) },
      campaign: { update: vi.fn().mockResolvedValue(undefined), findUnique: vi.fn().mockResolvedValue(null) }
    };
    const emitCampaignProgress = vi.fn();
    const queue = loadQueueService({
      prisma,
      metaApi: { sendMetaMessage: vi.fn().mockRejectedValue(providerError) },
      emitCampaignProgress
    });
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const job = {
      id: 'job-1',
      data: {
        instanceName: 'Meta Page',
        number: 'recipient-1',
        message: 'hello',
        campaignId: 'campaign-1',
        messageRecordId: 'message-1',
        tenantId: 'tenant-1',
        channelType: 'messenger',
        phoneNumberId: 'page-1',
        accessToken: 'meta:v1:encrypted'
      }
    };

    let jobError;
    try {
      await queue.processor(job);
    } catch (error) {
      jobError = error;
    }
    await queue.handlers.failed(job, jobError);

    const captured = JSON.stringify({
      logs: errorLog.mock.calls,
      failReason: prisma.message.update.mock.calls[0][0].data.failReason,
      jobError: { code: jobError.code, message: jobError.message },
      emitted: emitCampaignProgress.mock.calls
    });

    expect(captured).not.toContain(token);
  });
});
