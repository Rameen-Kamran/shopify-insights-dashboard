// models/order.js
// Sequelize model for a Shopify order that we persist to MySQL.
// We only store the few fields the dashboard cares about, not the whole order.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define(
  'Order',
  {
    // Shopify order IDs are large numbers, so we use BIGINT.
    // This is our primary key; we do NOT auto-increment because the value
    // comes from Shopify. It also makes the write idempotent: if the same
    // webhook is delivered twice, the second insert would clash on this key.
    shopifyOrderId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      field: 'shopify_order_id',
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2), // money: 2 decimal places, never a float
      allowNull: false,
      field: 'total_price',
    },
    lineItemCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'line_item_count',
    },
    // When the order was created in Shopify (not when we saved it).
    shopifyCreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'shopify_created_at',
    },
  },
  {
    tableName: 'orders',
    timestamps: true, // adds createdAt / updatedAt = when WE stored the row
  }
);

module.exports = Order;
