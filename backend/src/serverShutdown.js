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

function createSignalHandler({
  shutdown,
  exit = process.exit,
  log = (message, details) => console.error(message, details)
}) {
  return async function handleSignal() {
    try {
      await shutdown();
      exit(0);
    } catch (_) {
      log('[Shutdown] Graceful shutdown failed', { errorCode: 'SERVER_SHUTDOWN_FAILED' });
      exit(1);
    }
  };
}

module.exports = { createGracefulShutdown, createSignalHandler };
