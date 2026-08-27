const axios = require('axios');
const { redactForLog } = require('../../../logging/redaction');

const API_BASE_URL = 'https://api.salla.dev/admin/v2';

function boundedRetryAfter(value, now) {
  const text = typeof value === 'string' ? value.trim() : '';
  const milliseconds = /^\d+$/.test(text)
    ? Number(text) * 1000
    : Date.parse(text) - now;
  return Math.min(60_000, Math.max(1000, Number.isFinite(milliseconds) ? milliseconds : 1000));
}

function missingProductsScope(error) {
  const message = error?.response?.data?.error?.message;
  return error?.response?.status === 401 && typeof message === 'string' &&
    /scopes?/i.test(message) && /products\.read(?:_write)?/i.test(message);
}

function providerError(error, now) {
  const status = error?.response?.status;
  const code = missingProductsScope(error)
    ? 'STORE_PROVIDER_SCOPE_MISSING'
    : error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
    ? 'STORE_PROVIDER_TIMEOUT'
    : status === 404 ? 'STORE_PROVIDER_NOT_FOUND'
      : status === 429 ? 'STORE_RATE_LIMITED'
        : status >= 500 ? 'STORE_PROVIDER_UNAVAILABLE'
          : status === 401 ? 'STORE_PROVIDER_UNAUTHORIZED'
            : 'STORE_PROVIDER_REQUEST_FAILED';
  const typed = new Error(code);
  typed.code = code;
  if (status === 429) {
    const headers = error?.response?.headers || {};
    typed.retryAfterMs = boundedRetryAfter(headers['retry-after'] ?? headers['Retry-After'], now);
  }
  return typed;
}

function createSallaClient({ http = axios, tokenService, timeoutMs = 2500, clock = Date.now } = {}) {
  async function request(context, operation, path, params) {
    const startedAt = clock();
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
          provider: 'salla', integrationId: context.integrationId, operation, durationMs: Math.max(0, clock() - startedAt), outcome: 'success'
        }));
        return response.data;
      } catch (error) {
        if (error?.response?.status === 401 && !missingProductsScope(error) && !forceRefresh) {
          forceRefresh = true;
          continue;
        }
        const typed = providerError(error, clock());
        console.info('store.salla.request', redactForLog({
          provider: 'salla', integrationId: context.integrationId, operation, durationMs: Math.max(0, clock() - startedAt),
          outcome: 'error', errorCode: typed.code
        }));
        throw typed;
      }
    }
  }

  return {
    async searchProducts(context, query) {
      const response = await request(context, 'search_products', '/products', { keyword: query, per_page: 5 });
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
