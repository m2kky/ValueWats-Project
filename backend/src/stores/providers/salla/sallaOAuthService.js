const axios = require('axios');
const { encryptStoreCredentials, assertStoreCredentialEncryptionConfigured } = require('../../storeCredentialCrypto');
const { createStoreOAuthState, verifyStoreOAuthState } = require('../../storeOAuthState');

const AUTH_URL = 'https://accounts.salla.sa/oauth2/auth';
const TOKEN_URL = 'https://accounts.salla.sa/oauth2/token';
const USER_INFO_URL = 'https://accounts.salla.sa/oauth2/user/info';

function codedError(code) {
  return Object.assign(new Error(code), { code });
}

function configured() {
  try {
    assertStoreCredentialEncryptionConfigured();
  } catch (_) {
    throw codedError('SALLA_NOT_CONFIGURED');
  }
  if (['SALLA_CLIENT_ID', 'SALLA_CLIENT_SECRET', 'SALLA_WEBHOOK_SECRET', 'BACKEND_URL']
    .some((name) => !process.env[name]?.trim())) {
    throw codedError('SALLA_NOT_CONFIGURED');
  }
  return `${process.env.BACKEND_URL.replace(/\/+$/, '')}/api/oauth/salla/callback`;
}

function merchant(data) {
  const value = data?.merchant || data?.data?.merchant || data?.data || data;
  const id = value?.id;
  if ((typeof id !== 'string' && typeof id !== 'number') || !String(id).trim()) throw codedError('SALLA_MERCHANT_INFO_FAILED');
  const metadata = {};
  if (typeof value.name === 'string' && value.name.length <= 256) metadata.merchantName = value.name;
  if (typeof value.domain === 'string' && value.domain.length <= 256) metadata.merchantDomain = value.domain;
  return { id: String(id), metadata };
}

function token(data, now) {
  if (typeof data?.access_token !== 'string' || !data.access_token || typeof data.refresh_token !== 'string' || !data.refresh_token ||
      !Number.isFinite(Number(data.expires_in)) || Number(data.expires_in) <= 0) throw codedError('SALLA_TOKEN_EXCHANGE_FAILED');
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(now.getTime() + Number(data.expires_in) * 1000).toISOString()
  };
}

function oauthLog(integrationId, startedAt, outcome, errorCode) {
  console.info('store.salla.oauth', {
    ...(integrationId ? { integrationId } : {}), operation: 'oauth_callback', durationMs: Date.now() - startedAt,
    outcome, ...(errorCode ? { errorCode } : {})
  });
}

function createSallaOAuthService({ prisma, http = axios, queue, clock = () => new Date() } = {}) {
  async function createAuthUrl({ tenantId }) {
    const redirectUri = configured();
    const integration = await prisma.integration.create({
      data: {
        tenantId, type: 'store_salla', name: 'Salla Store', status: 'pending',
        credentials: encryptStoreCredentials({ provider: 'salla', pending: true })
      }
    });
    const state = createStoreOAuthState({ integrationId: integration.id, tenantId, flow: 'connect', now: clock() });
    const url = new URL(AUTH_URL);
    url.search = new URLSearchParams({
      client_id: process.env.SALLA_CLIENT_ID, redirect_uri: redirectUri,
      response_type: 'code', scope: 'products.read offline_access', state
    }).toString();
    return { authUrl: url.toString() };
  }

  async function reconnect({ tenantId, integrationId }) {
    const redirectUri = configured();
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId, tenantId, type: 'store_salla',
        status: { in: ['active', 'error', 'reauthorization_required'] }
      }
    });
    if (!integration) throw codedError('STORE_INTEGRATION_NOT_FOUND');
    const state = createStoreOAuthState({ integrationId, tenantId, flow: 'reconnect', now: clock() });
    const url = new URL(AUTH_URL);
    url.search = new URLSearchParams({
      client_id: process.env.SALLA_CLIENT_ID, redirect_uri: redirectUri,
      response_type: 'code', scope: 'products.read offline_access', state
    }).toString();
    return { authUrl: url.toString() };
  }

  async function completeCallback({ code, state }) {
    const startedAt = Date.now();
    let integrationId;
    try {
      const redirectUri = configured();
      let tenantId;
      let flow;
      try {
        ({ integrationId, tenantId, flow } = verifyStoreOAuthState(state, { now: clock() }));
      } catch (_) {
        throw codedError('SALLA_INVALID_STATE');
      }
      if (typeof code !== 'string' || !code) throw codedError('SALLA_INVALID_CALLBACK');
      const targetStatus = flow === 'reconnect'
        ? { in: ['active', 'error', 'reauthorization_required'] }
        : 'pending';
      const targetWhere = { id: integrationId, tenantId, type: 'store_salla', status: targetStatus };
      const integration = await prisma.integration.findFirst({ where: targetWhere });
      if (!integration) throw codedError('STORE_INTEGRATION_NOT_FOUND');
      let tokenResponse;
      try {
        tokenResponse = await http.post(TOKEN_URL, new URLSearchParams({
          grant_type: 'authorization_code', code, client_id: process.env.SALLA_CLIENT_ID,
          client_secret: process.env.SALLA_CLIENT_SECRET, redirect_uri: redirectUri
        }).toString(), { timeout: 2500, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      } catch (_) {
        throw codedError('SALLA_TOKEN_EXCHANGE_FAILED');
      }
      const credentials = token(tokenResponse?.data, clock());
      let merchantResponse;
      try {
        merchantResponse = await http.get(USER_INFO_URL, { timeout: 2500, headers: { Authorization: `Bearer ${credentials.accessToken}` } });
      } catch (_) {
        throw codedError('SALLA_MERCHANT_INFO_FAILED');
      }
      const account = merchant(merchantResponse?.data);
      const saved = await prisma.integration.updateMany({
        where: targetWhere,
        data: { credentials: encryptStoreCredentials(credentials), externalAccountId: account.id, metadata: account.metadata, status: 'active' }
      });
      if (saved.count !== 1) throw codedError('STORE_INTEGRATION_NOT_FOUND');
      try {
        await queue.enqueueFullSync({ tenantId: integration.tenantId, integrationId: integration.id });
      } catch (_) {
        await prisma.integration.updateMany({
          where: { id: integration.id, tenantId: integration.tenantId, type: 'store_salla' }, data: { status: 'error' }
        });
        throw codedError('SALLA_INITIAL_SYNC_FAILED');
      }
      oauthLog(integration.id, startedAt, 'success');
      return { id: integration.id };
    } catch (error) {
      const code = /^SALLA_[A-Z0-9_]+$|^STORE_INTEGRATION_NOT_FOUND$/.test(error?.code || '') ? error.code : 'SALLA_OAUTH_FAILED';
      oauthLog(integrationId, startedAt, 'error', code);
      throw codedError(code);
    }
  }

  async function reconcilePending() {
    return prisma.integration.deleteMany({
      where: { type: 'store_salla', status: 'pending', updatedAt: { lt: new Date(clock().getTime() - 60 * 60 * 1000) } }
    });
  }

  return { createAuthUrl, reconnect, completeCallback, reconcilePending };
}

module.exports = { createSallaOAuthService };
