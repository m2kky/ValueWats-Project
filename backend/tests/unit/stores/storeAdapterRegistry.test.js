const { createStoreAdapterRegistry } = require('../../../src/stores/storeAdapterRegistry');

describe('Store adapter registry', () => {
  it('returns the registered adapter for an integration type', () => {
    const adapter = { provider: 'salla' };

    expect(createStoreAdapterRegistry({ store_salla: adapter }).get('store_salla')).toBe(adapter);
  });

  it('rejects unsupported providers with a stable error code', () => {
    try {
      createStoreAdapterRegistry({}).get('store_unknown');
    } catch (error) {
      expect(error).toMatchObject({ code: 'STORE_PROVIDER_UNSUPPORTED' });
    }
  });
});
