// routes/orders.js
// GET /api/orders -> fetch orders from Shopify and return them as JSON.

const express = require('express');
const { fetchOrders } = require('../services/shopify');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateLimit } = require('../middleware/validate');

const router = express.Router();

router.get(
  '/',
  validateLimit,
  asyncHandler(async (req, res) => {
    const orders = await fetchOrders(req.limit || 50);
    res.json({ count: orders.length, orders });
  })
);

module.exports = router;
