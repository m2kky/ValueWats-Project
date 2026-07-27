const axios = require('axios');
const metaApi = require('../../../src/services/metaApi');
const { encryptMetaToken } = require('../../../src/meta/metaTokenCrypto');

describe('Meta API logging', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = originalKey;
  });

  it('redacts Axios authorization and access token details from Meta failure logs', async () => {
    const token = 'meta-secret-token';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(axios, 'get').mockRejectedValue({
      code: 'ERR_BAD_REQUEST',
      message: `Request failed for access_token=${token}`,
      config: {
        headers: { Authorization: `Bearer ${token}` },
        params: { access_token: token }
      },
      response: { data: { error: { message: `Authorization: Bearer ${token}` } } }
    });

    await metaApi.getUserProfile({ accessToken: encryptMetaToken(token) }, 'psid-1');

    expect(JSON.stringify(warn.mock.calls)).not.toContain(token);
  });
});
