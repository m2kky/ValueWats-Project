const axios = require('axios');
const { decryptStoreCredentials, encryptStoreCredentials } = require('../../storeCredentialCrypto');
const { redactForLog } = require('../../../logging/redaction');

const TOKEN_URL = 'https://accounts.salla.sa/oauth2/token';

function tokenError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function validToken(credentials, now) {
  const expiresAt = new Date(credentials?.expiresAt);
  return typeof credentials?.accessToken === 'string' && credentials.accessToken &&
    Number.isFinite(expiresAt.getTime()) && expiresAt > now;
}

function unrecoverableOAuthError(error) {
  const status = error?.response?.status;
  return status === 400 || status === 401 || status === 403;
}

function knownTokenError(error) {
  return typeof error?.code === 'string' && error.code.startsWith('STORE_');
}

function createSallaTokenService({ prisma, http = axios, clock = () => new Date() } = {}) {
  const refreshes = new Map();

  async function refresh({ tenantId, integrationId, forceRefresh = false } = {}) {
    const startedAt = Date.now();
    try {
      const now = clock();
      const where = { id: integrationId, tenantId, type: 'store_salla', status: 'active' };
      const initial = await prisma.integration.findFirst({ where });
      if (!initial) throw tokenError('STORE_INTEGRATION_NOT_FOUND');
      const initialCredentials = decryptStoreCredentials(initial.credentials);
      if (!forceRefresh && validToken(initialCredentials, now)) return initialCredentials.accessToken;

      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))::text AS lock', `salla:${integrationId}`);
        const integration = await tx.integration.findFirst({ where });
        if (!integration) throw tokenError('STORE_INTEGRATION_NOT_FOUND');
        const credentials = decryptStoreCredentials(integration.credentials);
        const lockedNow = clock();
        if (validToken(credentials, lockedNow) && (!forceRefresh || integration.credentials !== initial.credentials)) {
          return { accessToken: credentials.accessToken };
        }
        if (typeof credentials.refreshToken !== 'string' || !credentials.refreshToken) {
          await tx.integration.updateMany({ where, data: { status: 'reauthorization_required' } });
          return { reauthorizationRequired: true };
        }

        let response;
        try {
          response = await http.post(TOKEN_URL, new URLSearchParams({
            grant_type: 'refresh_token', refresh_token: credentials.refreshToken,
            client_id: process.env.SALLA_CLIENT_ID || '', client_secret: process.env.SALLA_CLIENT_SECRET || ''
          }).toString(), { timeout: 2500, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        } catch (error) {
          if (!unrecoverableOAuthError(error)) throw tokenError('STORE_TOKEN_REFRESH_FAILED');
          await tx.integration.updateMany({ where, data: { status: 'reauthorization_required' } });
          return { reauthorizationRequired: true };
        }
        const data = response?.data || {};
        if (typeof data.access_token !== 'string' || !data.access_token || typeof data.refresh_token !== 'string' || !data.refresh_token ||
            !Number.isFinite(Number(data.expires_in)) || Number(data.expires_in) <= 0) {
          await tx.integration.updateMany({ where, data: { status: 'reauthorization_required' } });
          return { reauthorizationRequired: true };
        }
        const expiresAt = new Date(lockedNow.getTime() + Number(data.expires_in) * 1000);
        if (!Number.isFinite(expiresAt.getTime())) throw new Error('Invalid rotated token expiry');
        const nextCredentials = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: expiresAt.toISOString()
        };
        const updated = await tx.integration.updateMany({ where, data: { credentials: encryptStoreCredentials(nextCredentials), status: 'active' } });
        if (updated.count !== 1) throw tokenError('STORE_INTEGRATION_NOT_FOUND');
        return { accessToken: nextCredentials.accessToken };
      }, { maxWait: 5000, timeout: 10000 });
      if (result.reauthorizationRequired) throw tokenError('STORE_REAUTHORIZATION_REQUIRED');
      console.info('store.salla.token_refresh', redactForLog({
        provider: 'salla', integrationId, operation: 'token_refresh', durationMs: Date.now() - startedAt, outcome: 'success'
      }));
      return result.accessToken;
    } catch (error) {
      const typed = knownTokenError(error) ? error : tokenError('STORE_TOKEN_REFRESH_FAILED');
      console.info('store.salla.token_refresh', redactForLog({
        provider: 'salla', integrationId, operation: 'token_refresh', durationMs: Date.now() - startedAt,
        outcome: 'error', errorCode: typed.code
      }));
      throw typed;
    }
  }

  return {
    getAccessToken(input) {
      const key = `${input?.tenantId}:${input?.integrationId}:${input?.forceRefresh ? 'force' : 'normal'}`;
      if (refreshes.has(key)) return refreshes.get(key);
      const pending = refresh(input);
      refreshes.set(key, pending);
      pending.finally(() => refreshes.delete(key)).catch(() => {});
      return pending;
    }
  };
}

module.exports = { createSallaTokenService };
