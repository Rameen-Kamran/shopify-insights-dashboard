// StatCards.jsx — the row of summary cards at the top of the dashboard.
// Pure presentational component: it just receives the stats object and shows it.

// Format a number as USD currency, e.g. 1234.5 -> "$1,234.50".
function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0);
}

export default function StatCards({ stats }) {
  return (
    <div className="stat-cards">
      <div className="card">
        <div className="card-label">Total Orders</div>
        <div className="card-value">{stats.orderCount}</div>
      </div>

      <div className="card">
        <div className="card-label">Total Revenue</div>
        <div className="card-value">{formatMoney(stats.totalRevenue)}</div>
      </div>

      <div className="card">
        <div className="card-label">Top Product</div>
        <div className="card-value">
          {stats.topProduct ? stats.topProduct.title : '—'}
        </div>
      </div>
    </div>
  );
}
