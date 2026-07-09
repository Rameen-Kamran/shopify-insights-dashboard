// routes/stats.js
// GET /api/stats -> summary numbers for the dashboard cards & chart.
// Returns: order count, total revenue, revenue-per-product, and the top product.
//
// We derive everything from the orders' line items so the numbers are
// internally consistent (revenue chart totals match the revenue card).

const express = require('express');
const { fetchOrders } = require('../services/shopify');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await fetchOrders(250); // pull a good chunk for the summary

    let totalRevenue = 0;

    // Map of product title -> total revenue for that product.
    // Using a plain object as a simple accumulator.
    const revenueByProduct = {};

    for (const order of orders) {
      // total_price is a string like "42.00" in Shopify, so parse it.
      totalRevenue += parseFloat(order.total_price) || 0;

      // Sum each line item into its product bucket.
      for (const item of order.line_items || []) {
        const title = item.title || 'Unknown product';
        const lineRevenue = (parseFloat(item.price) || 0) * (item.quantity || 0);
        revenueByProduct[title] = (revenueByProduct[title] || 0) + lineRevenue;
      }
    }

    // Turn the accumulator into a sorted array for the chart (highest first).
    const revenuePerProduct = Object.entries(revenueByProduct)
      .map(([title, revenue]) => ({ title, revenue: Number(revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top product is simply the first one after sorting (or null if no orders).
    const topProduct = revenuePerProduct[0] || null;

    res.json({
      orderCount: orders.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      topProduct,
      revenuePerProduct,
    });
  })
);

module.exports = router;
