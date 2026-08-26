const axios = require('axios');
const { redactForLog } = require('../../../logging/redaction');

const API_BASE_URL = 'https://api.salla.dev/admin/v2';

function providerError(error) {
  const status = error?.response?.status;
  const code = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
    ? 'STORE_PROVIDER_TIMEOUT'
    : status === 404 ? 'STORE_PROVIDER_NOT_FOUND'
      : status === 429 ? 'STORE_PROVIDER_RATE_LIMITED'
        : status >= 500 ? 'STORE_PROVIDER_UNAVAILABLE'
          : status === 401 ? 'STORE_PROVIDER_UNAUTHORIZED'
            : 'STORE_PROVIDER_REQUEST_FAILED';
  const typed = new Error(code);
  typed.code = code;
  return typed;
}

function createSallaClient({ http = axios, tokenService, timeoutMs = 2500 } = {}) {
  async function request(context, operation, path, params) {
    const startedAt = Date.now();
    let forceRefresh = false;
    for (;;) {
      try {
        const accessToken = await tokenService.getAccessToken({ ...context, forceRefresh });
        const response = await http.get(`${API_BASE_URL}${path}`, {
          timeout: timeoutMs,
          headers: { Authorization: `Bearer ${accessToken}` },
          params
        });
        console.info('store.salla.request', redactForLog({
          provider: 'salla', integrationId: context.integrationId, operation, durationMs: Date.now() - startedAt, outcome: 'success'
        }));
        return response.data;
      } catch (error) {
        if (error?.response?.status === 401 && !forceRefresh) {
          forceRefresh = true;
          continue;
        }
        const typed = providerError(error);
        console.info('store.salla.request', redactForLog({
          provider: 'salla', integrationId: context.integrationId, operation, durationMs: Date.now() - startedAt,
          outcome: 'error', errorCode: typed.code
        }));
        throw typed;
      }
    }
  }

  return {
    async searchProducts(context, query) {
      const response = await request(context, 'search_products', '/products', { keyword: query, format: 'light', per_page: 5 });
      return Array.isArray(response?.data) ? response.data.slice(0, 5) : [];
    },
    async getProduct(context, productId) {
      return (await request(context, 'get_product', `/products/${encodeURIComponent(productId)}`))?.data || null;
    },
    async getVariants(context, productId) {
      const variants = (await request(context, 'get_variants', `/products/${encodeURIComponent(productId)}/variants`))?.data;
      return Array.isArray(variants) ? variants : [];
    },
    async listProductsPage(context, page) {
      const response = await request(context, 'list_products_page', '/products', { page, per_page: 100 });
      const nextPage = response?.pagination?.next_page;
      return { products: Array.isArray(response?.data) ? response.data : [], nextPage: Number.isInteger(nextPage) && nextPage > 0 ? nextPage : null };
    }
  };
}

module.exports = { createSallaClient };
