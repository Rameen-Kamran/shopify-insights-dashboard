// middleware/validate.js
// Tiny hand-written validators. We keep them dependency-free and simple so
// every line is explainable. They throw with a statusCode so the central
// errorHandler turns them into a 400 response.

// Throws an Error tagged as a 400 (client mistake).
function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

// Validates an optional ?limit= query param used by /products and /orders.
// Must be a whole number between 1 and 250 (Shopify's max page size).
function validateLimit(req, res, next) {
  const raw = req.query.limit;

  // limit is optional; if it's missing we just move on and use the default.
  if (raw === undefined) return next();

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 250) {
    return next(badRequest('limit must be an integer between 1 and 250'));
  }

  // Stash the parsed number so the route can use it directly.
  req.limit = value;
  next();
}

module.exports = { validateLimit, badRequest };
