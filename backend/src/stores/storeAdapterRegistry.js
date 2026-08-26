function createStoreAdapterRegistry(adapters) {
  return {
    get(type) {
      const adapter = adapters[type];
      if (adapter) return adapter;

      const error = new Error('Store provider is unsupported');
      error.code = 'STORE_PROVIDER_UNSUPPORTED';
      throw error;
    }
  };
}

module.exports = { createStoreAdapterRegistry };
