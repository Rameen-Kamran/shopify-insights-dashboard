// middleware/logger.js
// Very small request logger. Logs the method, path, status code and how long
// the request took. Runs on every request (mounted with app.use in index.js).

function requestLogger(req, res, next) {
  const start = Date.now();

  // 'finish' fires once the response has been sent, so by then we know the
  // final status code and total duration.
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });

  next(); // hand control to the next middleware/route
}

module.exports = requestLogger;
