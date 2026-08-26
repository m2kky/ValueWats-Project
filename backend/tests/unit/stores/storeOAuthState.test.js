const {
  createStoreOAuthState,
  verifyStoreOAuthState
} = require('../../../src/stores/storeOAuthState');

describe('Store OAuth state', () => {
  const originalSecret = process.env.SALLA_CLIENT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SALLA_CLIENT_SECRET;
    else process.env.SALLA_CLIENT_SECRET = originalSecret;
  });

  it('creates and verifies a signed OAuth state', () => {
    process.env.SALLA_CLIENT_SECRET = 'state-secret';
    const now = new Date('2026-08-26T10:00:00Z');
    const state = createStoreOAuthState({ integrationId: 'integration-1', tenantId: 'tenant-1', flow: 'connect', now });

    expect(verifyStoreOAuthState(state, { now })).toEqual({
      integrationId: 'integration-1', tenantId: 'tenant-1', flow: 'connect'
    });
  });

  it('rejects expired and modified OAuth state', () => {
    process.env.SALLA_CLIENT_SECRET = 'state-secret';
    const now = new Date('2026-08-26T10:00:00Z');
    const state = createStoreOAuthState({ integrationId: 'integration-1', tenantId: 'tenant-1', flow: 'reconnect', now });

    expect(() => verifyStoreOAuthState(`${state}x`, { now })).toThrow('Invalid OAuth state');
    expect(() => verifyStoreOAuthState(state, { now: new Date('2026-08-26T10:11:00Z') })).toThrow('OAuth state expired');
  });

  it('rejects invalid state shape, secret, and clock input', () => {
    process.env.SALLA_CLIENT_SECRET = 'state-secret';
    const now = new Date('2026-08-26T10:00:00Z');
    const state = createStoreOAuthState({ integrationId: 'integration-1', tenantId: 'tenant-1', flow: 'connect', now });

    expect(() => createStoreOAuthState({ integrationId: '', tenantId: 'tenant-1', flow: 'connect', now })).toThrow();
    expect(() => createStoreOAuthState({ integrationId: 'integration-1', tenantId: '', flow: 'connect', now })).toThrow();
    expect(() => createStoreOAuthState({ integrationId: 'integration-1', tenantId: 'tenant-1', flow: 'invalid', now })).toThrow();
    expect(() => createStoreOAuthState({ integrationId: 'integration-1', tenantId: 'tenant-1', flow: 'connect', now: new Date('invalid') })).toThrow();
    delete process.env.SALLA_CLIENT_SECRET;
    expect(() => verifyStoreOAuthState(state, { now })).toThrow('Invalid OAuth state');
  });
});
