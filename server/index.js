// index.js — the Express app entry point. This file wires everything together:
// config -> middleware -> routes -> error handling -> start the server.

// Load .env FIRST so every module below sees process.env values.
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const sequelize = require('./config/database');
require('./models/order'); // register the model so sequelize.sync() knows it

const requestLogger = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const statsRouter = require('./routes/stats');
const webhooksRouter = require('./routes/webhooks');

const app = express();

// --- Global middleware -----------------------------------------------------
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(requestLogger);

// --- Webhooks (MUST come before express.json) ------------------------------
// The webhook route needs the RAW request body to verify Shopify's HMAC
// signature. express.raw() gives us the body as a Buffer. If express.json()
// ran first it would consume and re-parse the body, and we'd lose the exact
// bytes the signature was calculated over. So we mount webhooks here, before
// the JSON parser below.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

// --- JSON parser for every OTHER route -------------------------------------
app.use(express.json());

// --- API routes ------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);

// --- Fallbacks -------------------------------------------------------------
app.use(notFound);      // any unknown route -> 404 JSON
app.use(errorHandler);  // any thrown/next(err) -> formatted JSON error

// --- Start up --------------------------------------------------------------
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Check the DB connection is actually working before we accept traffic.
    await sequelize.authenticate();
    console.log('MySQL connection OK');

    // Create/alter the "orders" table to match our model. In a real prod app
    // you'd use migrations instead, but sync() is perfect for a demo project.
    await sequelize.sync();
    console.log('Models synced');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1); // exit so the problem is obvious instead of half-running
  }
}

start();
