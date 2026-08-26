const { EventEmitter } = require('events');
const { createGracefulShutdown } = require('../../src/serverShutdown');

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
