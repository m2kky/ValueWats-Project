const { EventEmitter } = require('events');
const { createGracefulShutdown, createSignalHandler } = require('../../src/serverShutdown');

it('closes HTTP and the Store queue once and awaits both', async () => {
  const server = new EventEmitter();
  server.listening = true;
  server.close = vi.fn((callback) => {
    server.listening = false;
    server.emit('close');
    callback();
  });
  let finishQueueClose;
  const storeSyncQueue = { close: vi.fn(() => new Promise((resolve) => { finishQueueClose = resolve; })) };
  const { shutdown, closeQueue } = createGracefulShutdown({ server, storeSyncQueue });
  server.on('close', closeQueue);

  const first = shutdown();
  const second = shutdown();
  let finished = false;
  first.then(() => { finished = true; });
  await Promise.resolve();

  expect(first).toBe(second);
  expect(server.close).toHaveBeenCalledOnce();
  expect(storeSyncQueue.close).toHaveBeenCalledOnce();
  expect(finished).toBe(false);

  finishQueueClose();
  await first;
  expect(finished).toBe(true);
});

it('exits from the signal path only after graceful shutdown finishes', async () => {
  let finishShutdown;
  const shutdown = vi.fn(() => new Promise((resolve) => { finishShutdown = resolve; }));
  const exit = vi.fn();
  const handleSignal = createSignalHandler({ shutdown, exit, log: vi.fn() });

  const pending = handleSignal();
  await Promise.resolve();
  expect(exit).not.toHaveBeenCalled();

  finishShutdown();
  await pending;
  expect(exit).toHaveBeenCalledOnce();
  expect(exit).toHaveBeenCalledWith(0);
});

it('exits with failure when graceful shutdown rejects', async () => {
  const exit = vi.fn();
  const log = vi.fn();
  const handleSignal = createSignalHandler({
    shutdown: vi.fn().mockRejectedValue(new Error('close failed')),
    exit,
    log
  });

  await handleSignal();

  expect(exit).toHaveBeenCalledWith(1);
  expect(log).toHaveBeenCalledWith('[Shutdown] Graceful shutdown failed', { errorCode: 'SERVER_SHUTDOWN_FAILED' });
});
