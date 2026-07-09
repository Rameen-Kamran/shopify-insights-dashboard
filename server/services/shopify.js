// services/shopify.js
// A thin wrapper around the Shopify Admin REST API.
// Keeping all Shopify calls in one place means the routes stay clean and
// we only build the URL / auth header in a single spot.

const axios = require('axios');

// Single source of truth for the Admin API version. Shopify only supports a
// version for 12 months, so this must be kept current. The same value is used
// for REST calls here and for the webhook we register (see README).
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-07';

// Build the base URL once, e.g. https://my-store.myshopify.com/admin/api/2026-07
function getBaseUrl() {
  const store = process.env.SHOPIFY_STORE_URL;
  return `https://${store}/admin/api/${API_VERSION}`;
}

// A pre-configured axios client. Shopify authenticates Admin API requests
// with the "X-Shopify-Access-Token" header, NOT a Bearer token.
function getClient() {
  return axios.create({
    baseURL: getBaseUrl(),
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    timeout: 10000, // fail fast instead of hanging if Shopify is slow
  });
}

// Fetch products. `limit` caps how many come back (Shopify max is 250).
async function fetchProducts(limit = 50) {
  const client = getClient();
  const response = await client.get('/products.json', {
    params: { limit },
  });
  // Shopify wraps the array in a top-level key: { products: [...] }
  return response.data.products;
}

// Fetch orders. By default Shopify only returns "open" orders, so we pass
// status=any to get everything (open, closed, cancelled).
async function fetchOrders(limit = 50) {
  const client = getClient();
  const response = await client.get('/orders.json', {
    params: { limit, status: 'any' },
  });
  return response.data.orders;
}

module.exports = {
  API_VERSION,
  fetchProducts,
  fetchOrders,
};
