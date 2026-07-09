// App.jsx — the single dashboard page.
// Responsibilities:
//   1. Fetch stats + products from the backend when the page loads.
//   2. Show loading / error states while that happens.
//   3. Render the stat cards, revenue chart, and products table.

import { useEffect, useState } from 'react';
import { getStats, getProducts } from './api';
import StatCards from './components/StatCards';
import RevenueChart from './components/RevenueChart';
import ProductsTable from './components/ProductsTable';

export default function App() {
  // Three pieces of state: the data, whether we're loading, and any error.
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect with an empty dependency array [] runs ONCE, after first render.
  useEffect(() => {
    // We define an async function inside because useEffect itself can't be async.
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Fetch both endpoints in parallel — faster than awaiting one at a time.
        const [statsData, productsData] = await Promise.all([
          getStats(),
          getProducts(),
        ]);

        setStats(statsData);
        setProducts(productsData.products);
      } catch (err) {
        // Any thrown error from api.js lands here.
        setError(err.message);
      } finally {
        // Runs whether we succeeded or failed, so the spinner always stops.
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Shopify Insights</h1>
        <p className="muted">Store performance at a glance</p>
      </header>

      {/* Loading state */}
      {loading && <p className="status">Loading dashboard…</p>}

      {/* Error state */}
      {error && !loading && (
        <div className="status error">
          <strong>Could not load data.</strong>
          <div>{error}</div>
        </div>
      )}

      {/* Success state — only render once we have stats and aren't loading */}
      {!loading && !error && stats && (
        <>
          <StatCards stats={stats} />

          <section className="panel">
            <h2>Revenue per product</h2>
            <RevenueChart data={stats.revenuePerProduct} />
          </section>

          <section className="panel">
            <h2>Products</h2>
            <ProductsTable products={products} />
          </section>
        </>
      )}
    </div>
  );
}
