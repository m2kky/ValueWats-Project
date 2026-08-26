function createStoreAdapterRegistry(adapters) {
  return {
    get(type) {
      const adapter = Object.hasOwn(adapters, type) ? adapters[type] : null;
      if (adapter) return adapter;

      const error = new Error('Store provider is unsupported');
      error.code = 'STORE_PROVIDER_UNSUPPORTED';
      throw error;
    }
  };
}

module.exports = { createStoreAdapterRegistry };
