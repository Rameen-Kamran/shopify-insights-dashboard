// middleware/errorHandler.js
// Centralized error handling. Any route that calls next(err) OR any async
// route wrapped with asyncHandler (below) ends up here, so we format errors
// in ONE place instead of repeating try/catch responses everywhere.

// Express recognizes an error-handling middleware by its FOUR arguments
// (err, req, res, next). That signature is what makes it special.
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // If the error came from an axios call to Shopify, surface Shopify's status.
  const status = err.response?.status || err.statusCode || 500;

  res.status(status).json({
    error: {
      message: err.message || 'Something went wrong',
    },
  });
}

// Small helper so we don't write try/catch in every async route.
// It wraps an async function and forwards any rejected promise to next(),
// which sends it to errorHandler above.
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler for any route we didn't define.
function notFound(req, res) {
  res.status(404).json({ error: { message: `Not found: ${req.originalUrl}` } });
}

module.exports = { errorHandler, asyncHandler, notFound };
