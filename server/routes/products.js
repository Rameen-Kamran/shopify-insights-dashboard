// routes/products.js
// GET /api/products -> fetch products from Shopify and return them as JSON.

const express = require('express');
const { fetchProducts } = require('../services/shopify');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateLimit } = require('../middleware/validate');

const router = express.Router();

router.get(
  '/',
  validateLimit, // rejects a bad ?limit before we ever call Shopify
  asyncHandler(async (req, res) => {
    // req.limit is set by validateLimit when a valid ?limit was provided.
    const products = await fetchProducts(req.limit || 50);
    res.json({ count: products.length, products });
  })
);

module.exports = router;
