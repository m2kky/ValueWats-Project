function decodeEntities(value) {
  const named = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  return String(value || '').replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (_, entity) => {
    const normalized = entity.toLowerCase();
    if (normalized[0] !== '#') return named[normalized];
    const code = normalized[1] === 'x' ? Number.parseInt(normalized.slice(2), 16) : Number.parseInt(normalized.slice(1), 10);
    return Number.isSafeInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  });
}

function text(value, limit) {
  return decodeEntities(String(value || ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function money(value) {
  const amount = value && typeof value === 'object' ? value.amount : value;
  if (amount === null || amount === undefined || amount === '') return null;
  const number = Number(amount);
  return Number.isFinite(number) ? number.toFixed(2) : null;
}

function productId(value) {
  return value === undefined || value === null ? null : String(value);
}

function string(value) {
  return typeof value === 'string' ? value : null;
}

function availability(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function inferredAvailability({ quantity, unlimitedQuantity, status }) {
  if (unlimitedQuantity === true) return true;
  if (status === 'out') return false;
  if (!Number.isFinite(quantity)) return null;
  if (quantity > 0) return true;
  return unlimitedQuantity === false ? false : null;
}

function normalizeSallaVariant(variant, currency) {
  const quantity = variant?.quantity === undefined || variant?.quantity === null ? NaN : Number(variant.quantity);
  const rawUnlimitedQuantity = variant?.unlimited_quantity ?? variant?.is_unlimited;
  const unlimitedQuantity = typeof rawUnlimitedQuantity === 'boolean' ? rawUnlimitedQuantity : null;
  return {
    externalId: productId(variant?.id),
    sku: variant?.sku ? String(variant.sku) : null,
    name: variant?.name ? String(variant.name) : null,
    price: money(variant?.price),
    salePrice: money(variant?.sale_price),
    currency: string(variant?.price?.currency) || string(variant?.currency) || currency || null,
    isAvailable: availability(
      variant?.is_available ?? variant?.available,
      inferredAvailability({ quantity, unlimitedQuantity })
    ),
    quantity: Number.isFinite(quantity) ? quantity : null,
    unlimitedQuantity
  };
}

function normalizeSallaProduct(product, { descriptionLimit = 4000, variants = product?.variants } = {}) {
  const quantity = product?.quantity === undefined || product?.quantity === null ? NaN : Number(product.quantity);
  const rawUnlimitedQuantity = product?.unlimited_quantity ?? product?.is_unlimited;
  const unlimitedQuantity = typeof rawUnlimitedQuantity === 'boolean' ? rawUnlimitedQuantity : null;
  const currency = string(product?.price?.currency) || string(product?.currency);
  return {
    externalId: productId(product?.id),
    sku: product?.sku ? String(product.sku) : null,
    name: product?.name ? String(product.name) : '',
    description: text(product?.description, descriptionLimit),
    price: money(product?.price),
    salePrice: money(product?.sale_price),
    currency,
    status: product?.status ? String(product.status) : null,
    isAvailable: availability(
      product?.is_available ?? product?.available,
      inferredAvailability({ quantity, unlimitedQuantity, status: product?.status })
    ),
    quantity: Number.isFinite(quantity) ? quantity : null,
    unlimitedQuantity,
    imageUrl: string(product?.image?.url) || string(product?.image) || string(product?.thumbnail),
    storefrontUrl: string(product?.url) || string(product?.storefront_url),
    variants: Array.isArray(variants) ? variants.map((variant) => normalizeSallaVariant(variant, currency)) : []
  };
}

function createSallaAdapter({ client, tokenService } = {}) {
  return {
    provider: 'salla',
    async searchProducts(context, query) {
      return (await client.searchProducts(context, query)).map((product) => normalizeSallaProduct(product, { descriptionLimit: 300 }));
    },
    async getProduct(context, externalProductId) {
      const [product, variants] = await Promise.all([
        client.getProduct(context, externalProductId),
        client.getVariants(context, externalProductId)
      ]);
      return normalizeSallaProduct(product, { variants });
    },
    async listProductsPage(context, page) {
      const result = await client.listProductsPage(context, page);
      return { ...result, products: result.products.map((product) => normalizeSallaProduct(product)) };
    },
    refreshCredentials(context) {
      return tokenService.getAccessToken({ ...context, forceRefresh: true });
    },
    normalizeProduct: normalizeSallaProduct
  };
}

module.exports = { createSallaAdapter, normalizeSallaProduct };
