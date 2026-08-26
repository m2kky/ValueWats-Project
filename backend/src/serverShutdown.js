function createGracefulShutdown({ server, storeSyncQueue }) {
  let queueClosePromise;
  let shutdownPromise;

  const closeQueue = () => {
    queueClosePromise ||= Promise.resolve().then(() => storeSyncQueue.close());
    return queueClosePromise;
  };

  const shutdown = () => {
    shutdownPromise ||= (async () => {
      if (server.listening) {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      }
      await closeQueue();
    })();
    return shutdownPromise;
  };

  return { closeQueue, shutdown };
}

module.exports = { createGracefulShutdown };
