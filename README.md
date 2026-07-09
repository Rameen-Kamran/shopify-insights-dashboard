# Shopify Store Insights Dashboard

A small full-stack app that pulls products and orders from a Shopify store and
shows them on a dashboard: total orders, total revenue, top product, a revenue
bar chart, and a products table. It also receives **order-created webhooks** from
Shopify and stores those orders in MySQL.

Built to be simple and readable — plain JavaScript, no TypeScript, no magic.
## Dashboard
<img width="792" height="502" alt="Screenshot" src="https://github.com/user-attachments/assets/d80d13e6-77a8-4230-afd3-4a47b74a8810" />

---

## Tech stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | React (Vite) + Recharts                           |
| Backend   | Node.js + Express                                 |
| Database  | MySQL 8 (native, `localhost:3306`)                |
| ORM       | Sequelize + `mysql2` driver                       |
| External  | Shopify Admin REST API (`2026-07`)                |

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │        Shopify Store         │
                    │  (products, orders, webhooks)│
                    └───────┬──────────────▲───────┘
             Admin REST API │              │ order-created webhook
             (pull on demand)│             │ (HMAC-signed POST)
                            ▼              │
   ┌────────────────────────────────────────────────────────┐
   │                  Express backend (/server)              │
   │                                                         │
   │  services/shopify.js ── fetchProducts / fetchOrders     │
   │                                                         │
   │  routes/                                                │
   │    GET  /api/products  ─┐                               │
   │    GET  /api/orders     ├─ call Shopify, return JSON    │
   │    GET  /api/stats     ─┘  (totals + revenue/product)   │
   │    POST /api/webhooks/orders-create                     │
   │         └─ verify HMAC ─► save Order (Sequelize) ──┐    │
   │                                                    │    │
   │  middleware: logger, validation, error handler     │    │
   └───────────────────────────────┬────────────────────┼───┘
              fetch('/api/...')     │                    ▼
                                    │            ┌──────────────┐
                                    │            │   MySQL 8    │
   ┌────────────────────────────────▼──┐         │ shopify_     │
   │      React dashboard (/client)     │         │  insights DB │
   │  StatCards · RevenueChart · Table  │         │  orders table│
   │  (Vite dev server, port 5173)      │         └──────────────┘
   └────────────────────────────────────┘
```

**Two data paths on purpose:**

1. **Pull (on page load):** the frontend calls `/api/products`, `/api/orders`,
   `/api/stats`; the backend calls Shopify live and returns JSON. Nothing is
   stored — it's a fresh read every time.
2. **Push (webhooks):** when an order is created, Shopify POSTs to
   `/api/webhooks/orders-create`. We verify it's really from Shopify (HMAC), then
   save a slim record to MySQL. This is the part that persists data.

---

## Project structure

```
shopify-insights-dashboard/
├── README.md
├── .gitignore
├── server/                     # Express backend
│   ├── index.js                # app entry: middleware, routes, startup
│   ├── .env.example            # copy to .env and fill in
│   ├── config/database.js      # Sequelize connection
│   ├── models/order.js         # Order model (persisted webhooks)
│   ├── services/shopify.js     # Shopify Admin API calls
│   ├── middleware/
│   │   ├── logger.js           # request logging
│   │   ├── validate.js         # input validation (?limit)
│   │   └── errorHandler.js     # central error handling + asyncHandler
│   └── routes/
│       ├── products.js         # GET /api/products
│       ├── orders.js           # GET /api/orders
│       ├── stats.js            # GET /api/stats
│       └── webhooks.js         # POST /api/webhooks/orders-create (HMAC)
└── client/                     # React + Vite frontend
    ├── index.html
    ├── vite.config.js          # dev server + /api proxy to backend
    └── src/
        ├── main.jsx            # React entry
        ├── App.jsx             # the dashboard page (fetch + loading/error)
        ├── api.js              # backend fetch helpers
        ├── styles.css          # minimal styling + light/dark palette
        └── components/
            ├── StatCards.jsx
            ├── ProductsTable.jsx
            └── RevenueChart.jsx
```

---

## Prerequisites

- **Node.js 18+**
- **MySQL 8** running natively on `localhost:3306`, with the database already
  created:
  ```sql
  CREATE DATABASE shopify_insights;
  ```
- A Shopify store with a **custom app** that has Admin API access (to get the
  `shpat_...` token and read `products` + `orders` scopes).

---

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # then edit .env with real values
npm run dev               # starts on http://localhost:4000
```

Fill in `.env`:

| Variable                 | What it is                                              |
| ------------------------ | ------------------------------------------------------- |
| `PORT`                   | Backend port (default 4000)                             |
| `DB_HOST` / `DB_PORT`    | MySQL host/port (`localhost` / `3306`)                  |
| `DB_NAME`                | `shopify_insights`                                      |
| `DB_USER` / `DB_PASSWORD`| Your MySQL credentials                                  |
| `SHOPIFY_STORE_URL`      | `your-store.myshopify.com` (no `https://`)              |
| `SHOPIFY_ADMIN_TOKEN`    | Admin API access token (`shpat_...`)                    |
| `SHOPIFY_API_VERSION`    | `2026-07` or later                                      |
| `SHOPIFY_WEBHOOK_SECRET` | Signing secret used to verify webhooks                  |
| `CLIENT_ORIGIN`          | Frontend URL for CORS (`http://localhost:5173`)         |

On startup the server checks the DB connection and runs `sequelize.sync()` to
create the `orders` table if it doesn't exist.

### 2. Frontend

```bash
cd client
npm install
npm run dev               # starts on http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the
backend on port 4000, so no CORS config is needed in development.

---

## API reference

| Method | Route                          | Purpose                                             |
| ------ | ------------------------------ | --------------------------------------------------- |
| GET    | `/api/health`                  | Liveness check (`{ status: "ok" }`)                 |
| GET    | `/api/products?limit=50`       | Products from Shopify (`limit` 1–250, optional)     |
| GET    | `/api/orders?limit=50`         | Orders from Shopify (`limit` 1–250, optional)       |
| GET    | `/api/stats`                   | Order count, total revenue, top product, per-product revenue |
| POST   | `/api/webhooks/orders-create`  | Shopify webhook; HMAC-verified, saves order to MySQL |

---

## Registering the order-created webhook

You need to tell Shopify to POST to your backend when an order is created. Two
ways:

### Option A — Shopify Admin UI
**Settings → Notifications → Webhooks → Create webhook**
- Event: **Order creation**
- Format: **JSON**
- URL: your public HTTPS URL + `/api/webhooks/orders-create`
  (e.g. `https://abc123.ngrok-free.app/api/webhooks/orders-create`)

Shopify shows a **signing secret** on that page — put it in `.env` as
`SHOPIFY_WEBHOOK_SECRET`.

### Option B — Admin REST API
```bash
curl -X POST \
  "https://your-store.myshopify.com/admin/api/2026-07/webhooks.json" \
  -H "X-Shopify-Access-Token: shpat_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "orders/create",
      "address": "https://abc123.ngrok-free.app/api/webhooks/orders-create",
      "format": "json"
    }
  }'
```

---

## Testing the webhook locally with ngrok

Shopify can't reach `localhost`, so we expose the backend with **ngrok**.

1. **Install ngrok** and start it pointing at the backend port:
   ```bash
   ngrok http 4000
   ```
   Copy the HTTPS forwarding URL it prints, e.g.
   `https://abc123.ngrok-free.app`.

2. **Register the webhook** (Option A or B above) using that URL +
   `/api/webhooks/orders-create`, and copy the signing secret into `.env`.
   Restart the backend so it picks up the new `SHOPIFY_WEBHOOK_SECRET`.

3. **Trigger an order** — either place a test order in your store, or use
   Shopify's **"Send test notification"** button on the webhook page.

4. **Watch the backend logs.** A valid webhook logs
   `POST /api/webhooks/orders-create -> 200`, and a new row appears in the
   `orders` table:
   ```sql
   SELECT * FROM shopify_insights.orders;
   ```

### Verifying the HMAC check yourself

The endpoint rejects anything it can't verify. To prove it, send a fake request
with a bad signature — you should get **401**:

```bash
curl -i -X POST http://localhost:4000/api/webhooks/orders-create \
  -H "X-Shopify-Hmac-Sha256: not-a-real-signature" \
  -H "Content-Type: application/json" \
  -d '{"id":123,"total_price":"9.99","created_at":"2024-01-01T00:00:00Z","line_items":[]}'
# HTTP/1.1 401 Unauthorized
```

**How the verification works (see `server/routes/webhooks.js` for the commented
code):**

1. This route is mounted with `express.raw()`, **not** `express.json()`, so we
   get the request body as the exact raw bytes Shopify sent.
2. We compute `HMAC-SHA256(rawBody, SHOPIFY_WEBHOOK_SECRET)` and base64-encode it.
3. We compare our result to the `X-Shopify-Hmac-Sha256` header using
   `crypto.timingSafeEqual` (constant-time, to avoid timing attacks).
4. Match → parse the JSON and `upsert` the order. No match → **401**.

The raw body matters: if `express.json()` parsed and re-serialized the body
first, even a whitespace change would make our hash differ from Shopify's and
every webhook would fail verification.

---

## Notes / possible extensions

- The `orders` table stores only what the dashboard needs (`shopify_order_id`,
  `total_price`, `line_item_count`, `shopify_created_at`). `upsert` on the Shopify
  order id keeps webhook delivery **idempotent** (duplicate deliveries don't
  create duplicate rows).
- The stats endpoint reads live from Shopify. A natural next step is to compute
  stats from the persisted `orders` table instead, so the dashboard reflects
  webhook data and survives Shopify rate limits.
```
