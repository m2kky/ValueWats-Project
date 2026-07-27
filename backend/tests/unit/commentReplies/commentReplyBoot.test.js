const fs = require('fs');
const path = require('path');
const {
  createCommentReplyProcessingRuntime
} = require('../../../src/commentReplies/commentReplyBoot');

describe('comment reply production boot', () => {
  it('runs inbound execution and comment outbox work in one reusable loop', async () => {
    const commentReplyWorker = {
      recoverStale: vi.fn().mockResolvedValue({ recovered: 0, failed: 0 }),
      runOnce: vi.fn().mockResolvedValue(null)
    };
    const outboxWorker = {
      recoverStaleDispatches: vi.fn().mockResolvedValue({ retried: 0, outcomeUnknown: 0 }),
      runOnce: vi.fn().mockResolvedValue(null)
    };
    let runtime;
    runtime = createCommentReplyProcessingRuntime({
      commentReplyWorker,
      outboxWorker,
      sleep: vi.fn(async () => runtime.stop()),
      logger: { error: vi.fn() }
    });

    await runtime.start();

    expect(commentReplyWorker.recoverStale).toHaveBeenCalled();
    expect(outboxWorker.recoverStaleDispatches).toHaveBeenCalled();
    expect(commentReplyWorker.runOnce).toHaveBeenCalledOnce();
    expect(outboxWorker.runOnce).toHaveBeenCalledOnce();
  });

  it('keeps the real root npm start chain wired to comment reply processing', () => {
    const root = path.resolve(__dirname, '../../../..');
    const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const backendPackage = JSON.parse(fs.readFileSync(path.join(root, 'backend/package.json'), 'utf8'));
    const serverSource = fs.readFileSync(path.join(root, 'backend/src/server.js'), 'utf8');

    expect(rootPackage.scripts.start).toBe('npm run start:backend');
    expect(rootPackage.scripts['start:backend']).toBe('cd backend && npm start');
    expect(backendPackage.scripts.start).toContain('node src/server.js');
    expect(serverSource).toContain('startCommentReplyProcessing');
  });
});
