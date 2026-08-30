const { createGoogleOAuthState, verifyGoogleOAuthState } = require('../../../src/googleSheets/googleOAuthState');

describe('Google OAuth state', () => {
  beforeEach(() => {
    process.env.GOOGLE_OAUTH_STATE_SECRET = 'test-google-state-secret';
  });

  it('signs tenant-bound expiring state', () => {
    const state = createGoogleOAuthState({
      integrationId: 'integration-1',
      tenantId: 'tenant-1',
      type: 'google_sheets_oauth',
      now: () => 1000
    });

    expect(verifyGoogleOAuthState(state, () => 2000)).toMatchObject({
      integrationId: 'integration-1',
      tenantId: 'tenant-1',
      type: 'google_sheets_oauth'
    });
  });

  it('rejects tampered and expired state', () => {
    const state = createGoogleOAuthState({
      integrationId: 'integration-1', tenantId: 'tenant-1', type: 'google_sheets_oauth', now: () => 1000
    });
    expect(() => verifyGoogleOAuthState(`${state}x`, () => 2000)).toThrow(/Invalid/);
    expect(() => verifyGoogleOAuthState(state, () => 700000)).toThrow(/Expired/);
  });
});
