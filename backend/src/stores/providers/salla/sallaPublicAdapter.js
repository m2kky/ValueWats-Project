const { normalizeSallaProduct } = require('./sallaAdapter');

function publicProduct(product) {
  const current = Number(product?.price);
  const regular = Number(product?.regular_price);
  return {
    ...product,
    price: Number.isFinite(regular) ? regular : product?.price,
    sale_price: Number.isFinite(current) && Number.isFinite(regular) && current < regular ? current : null
  };
}

function createSallaPublicAdapter({ client } = {}) {
  return {
    provider: 'salla_public',
    async searchProducts(context, query) {
      return (await client.searchProducts(context, query))
        .map(publicProduct)
        .map((product) => normalizeSallaProduct(product, { descriptionLimit: 300 }));
    },
    async getProduct(context, productId) {
      const product = await client.getProduct(context, productId);
      return product ? normalizeSallaProduct(publicProduct(product)) : null;
    },
    async listProductsPage(context, page) {
      const result = await client.listProductsPage(context, page);
      return {
        ...result,
        products: result.products.map(publicProduct).map((product) => normalizeSallaProduct(product))
      };
    }
  };
}

module.exports = { createSallaPublicAdapter };
