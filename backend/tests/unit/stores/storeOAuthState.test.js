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
    const state = createStoreOAuthState({ integrationId: 'integration-1', now });

    expect(verifyStoreOAuthState(state, { now })).toEqual({ integrationId: 'integration-1' });
  });

  it('rejects expired and modified OAuth state', () => {
    process.env.SALLA_CLIENT_SECRET = 'state-secret';
    const now = new Date('2026-08-26T10:00:00Z');
    const state = createStoreOAuthState({ integrationId: 'integration-1', now });

    expect(() => verifyStoreOAuthState(`${state}x`, { now })).toThrow('Invalid OAuth state');
    expect(() => verifyStoreOAuthState(state, { now: new Date('2026-08-26T10:11:00Z') })).toThrow('OAuth state expired');
  });

  it('rejects invalid state shape, secret, and clock input', () => {
    process.env.SALLA_CLIENT_SECRET = 'state-secret';
    const now = new Date('2026-08-26T10:00:00Z');
    const state = createStoreOAuthState({ integrationId: 'integration-1', now });

    expect(() => createStoreOAuthState({ integrationId: '', now })).toThrow();
    expect(() => createStoreOAuthState({ integrationId: 'integration-1', now: new Date('invalid') })).toThrow();
    delete process.env.SALLA_CLIENT_SECRET;
    expect(() => verifyStoreOAuthState(state, { now })).toThrow('Invalid OAuth state');
  });
});
