const { createStoreAdapterRegistry } = require('../../../src/stores/storeAdapterRegistry');

describe('Store adapter registry', () => {
  it('returns the registered adapter for an integration type', () => {
    const adapter = { provider: 'salla' };

    expect(createStoreAdapterRegistry({ store_salla: adapter }).get('store_salla')).toBe(adapter);
  });

  it('rejects unsupported providers with a stable error code', () => {
    expect(() => createStoreAdapterRegistry({}).get('store_unknown'))
      .toThrow(expect.objectContaining({ code: 'STORE_PROVIDER_UNSUPPORTED' }));
  });

  it('does not resolve inherited adapters', () => {
    const inherited = Object.create({ store_salla: { provider: 'salla' } });

    expect(() => createStoreAdapterRegistry(inherited).get('store_salla'))
      .toThrow(expect.objectContaining({ code: 'STORE_PROVIDER_UNSUPPORTED' }));
  });
});
