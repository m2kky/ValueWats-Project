const axios = require('axios');
const { decryptStoreCredentials } = require('../../storeCredentialCrypto');
const { redactForLog } = require('../../../logging/redaction');

const API_BASE_URL = 'https://api.salla.dev';

function providerError(error) {
  const status = error?.response?.status;
  const code = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
    ? 'STORE_PROVIDER_TIMEOUT'
    : status === 404 ? 'STORE_PROVIDER_NOT_FOUND'
      : status === 429 ? 'STORE_RATE_LIMITED'
        : status >= 500 ? 'STORE_PROVIDER_UNAVAILABLE'
          : 'STORE_PROVIDER_REQUEST_FAILED';
  return Object.assign(new Error(code), { code });
}

function publicConfig(value) {
  const config = decryptStoreCredentials(value);
  if (config.provider !== 'salla_public' || !/^\d+$/.test(config.storeIdentifier || '') || !config.storeUrl) {
    const error = new Error('STORE_INVALID_PROVIDER_RESPONSE');
    error.code = 'STORE_INVALID_PROVIDER_RESPONSE';
    throw error;
  }
  return config;
}

function safeCursor(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'api.salla.dev' || url.pathname !== '/store/v1/products') {
    const error = new Error('STORE_INVALID_PROVIDER_RESPONSE');
    error.code = 'STORE_INVALID_PROVIDER_RESPONSE';
    throw error;
  }
  return url.toString();
}

function createSallaPublicClient({ prisma, http = axios, timeoutMs = 4000, clock = Date.now } = {}) {
  async function configFor(context) {
    const integration = await prisma.integration.findFirst({
      where: {
        id: context.integrationId, tenantId: context.tenantId,
        type: 'store_salla', status: 'active'
      },
      select: { credentials: true }
    });
    if (!integration) {
      const error = new Error('STORE_INTEGRATION_NOT_FOUND');
      error.code = 'STORE_INTEGRATION_NOT_FOUND';
      throw error;
    }
    return publicConfig(integration.credentials);
  }

  async function request(context, operation, url) {
    const startedAt = clock();
    try {
      const config = await configFor(context);
      const response = await http.get(url, {
        timeout: timeoutMs,
        headers: {
          'store-identifier': config.storeIdentifier,
          'Accept-Language': 'ar',
          currency: 'SAR',
          Referer: config.storeUrl
        }
      });
      const validData = operation === 'get_product'
        ? response.data?.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)
        : Array.isArray(response.data?.data);
      if (response.data?.success !== true || !validData) {
        throw Object.assign(new Error('STORE_INVALID_PROVIDER_RESPONSE'), { code: 'STORE_INVALID_PROVIDER_RESPONSE' });
      }
      console.info('store.salla.public.request', redactForLog({
        integrationId: context.integrationId, operation,
        durationMs: Math.max(0, clock() - startedAt), outcome: 'success'
      }));
      return { payload: response.data, config };
    } catch (error) {
      const typed = /^STORE_[A-Z0-9_]+$/.test(error?.code || '') ? error : providerError(error);
      console.info('store.salla.public.request', redactForLog({
        integrationId: context.integrationId, operation,
        durationMs: Math.max(0, clock() - startedAt), outcome: 'error', errorCode: typed.code
      }));
      throw typed;
    }
  }

  return {
    async searchProducts(context, query) {
      const url = new URL('/store/v1/products', API_BASE_URL);
      url.searchParams.set('source', 'search');
      url.searchParams.set('filterable', '1');
      url.searchParams.set('filters[q]', String(query || ''));
      url.searchParams.set('source_value', String(query || ''));
      url.searchParams.set('limit', '5');
      const { payload } = await request(context, 'search_products', url.toString());
      return payload.data.slice(0, 5);
    },

    async getProduct(context, productId) {
      const url = `${API_BASE_URL}/store/v1/products/${encodeURIComponent(productId)}/details`;
      const { payload } = await request(context, 'get_product', url);
      return payload?.data && !Array.isArray(payload.data) ? payload.data : null;
    },

    async listProductsPage(context, page) {
      let url;
      if (page === 1) {
        const config = await configFor(context);
        url = new URL('/store/v1/products', API_BASE_URL);
        url.searchParams.set('source', 'categories');
        for (const categoryId of config.categoryIds || []) url.searchParams.append('source_value[]', categoryId);
        url.searchParams.set('limit', '100');
      } else {
        url = new URL(safeCursor(page));
      }
      const { payload } = await request(context, 'list_products_page', url.toString());
      return {
        products: payload.data,
        nextPage: payload.cursor?.next ? safeCursor(payload.cursor.next) : null
      };
    }
  };
}

module.exports = { createSallaPublicClient };
