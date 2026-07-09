// routes/webhooks.js
// POST /api/webhooks/orders-create
//
// Shopify calls this URL every time an order is created. Because anyone on the
// internet could POST here, we MUST prove the request really came from Shopify
// before trusting it. Shopify does that by signing each webhook with a shared
// secret (SHOPIFY_WEBHOOK_SECRET) and sending the signature in a header.
//
// IMPORTANT: this router is mounted with express.raw() in index.js, NOT
// express.json(). That means req.body here is the RAW bytes (a Buffer) exactly
// as Shopify sent them. We need the raw bytes because the signature is computed
// over the exact original body — if Express re-serialized the JSON, even a
// harmless change in spacing would make our hash differ from Shopify's.

const express = require('express');
const crypto = require('crypto'); // Node's built-in crypto, no dependency
const Order = require('../models/order');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// --- HMAC verification -----------------------------------------------------
// Returns true only if the signature in the header matches a signature we
// compute ourselves from the raw body + our secret.
function isValidShopifyWebhook(rawBody, hmacHeader) {
  // If Shopify didn't send the signature header, it can't be valid.
  if (!hmacHeader) return false;

  // 1. Compute our own HMAC-SHA256 over the raw body using the shared secret.
  //    Shopify sends the signature base64-encoded, so we digest to base64 too.
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody) // rawBody is a Buffer (the exact bytes Shopify sent)
    .digest('base64');

  // 2. Compare our digest to the header value. We use timingSafeEqual instead
  //    of === to avoid a "timing attack": a normal === can bail out early on
  //    the first differing character, and the tiny time difference could leak
  //    information about the secret. timingSafeEqual always takes the same
  //    amount of time regardless of where the bytes differ.
  const digestBuffer = Buffer.from(digest, 'utf8');
  const headerBuffer = Buffer.from(hmacHeader, 'utf8');

  // timingSafeEqual THROWS if the two buffers are different lengths, so we
  // guard against that first (different length = definitely not a match).
  if (digestBuffer.length !== headerBuffer.length) return false;

  return crypto.timingSafeEqual(digestBuffer, headerBuffer);
}

router.post(
  '/orders-create',
  asyncHandler(async (req, res) => {
    // Shopify puts the signature in this header (lowercased by Node).
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');

    // req.body is a Buffer here thanks to express.raw().
    if (!isValidShopifyWebhook(req.body, hmacHeader)) {
      // Reject anything we can't verify. 401 = "you are not authenticated".
      return res.status(401).json({ error: { message: 'Invalid webhook signature' } });
    }

    // Signature is valid, so now it's safe to parse the raw body into JSON.
    const order = JSON.parse(req.body.toString('utf8'));

    // Pull out just the fields we store. upsert = insert, or update if the
    // order id already exists. This makes the endpoint idempotent: Shopify
    // may deliver the same webhook more than once, and we won't create dupes.
    await Order.upsert({
      shopifyOrderId: order.id,
      totalPrice: order.total_price,
      lineItemCount: Array.isArray(order.line_items) ? order.line_items.length : 0,
      shopifyCreatedAt: order.created_at,
    });

    // Always reply 200 quickly. If Shopify doesn't get a 2xx it will retry,
    // so we acknowledge as soon as the order is saved.
    res.status(200).json({ received: true });
  })
);

module.exports = router;
