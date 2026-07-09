// RevenueChart.jsx — a Recharts bar chart of revenue per product.
//
// This is a SINGLE-series chart (one measure: revenue), so by design-viz rules
// there is no legend — the heading above the chart names the series. Colors come
// from CSS variables (--series-1, etc.) defined in styles.css, which lets the
// bar switch between the validated light/dark blue automatically.

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0);
}

// Custom tooltip so the hover box shows nicely-formatted currency.
function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      <div className="chart-tooltip-value">{formatMoney(payload[0].value)}</div>
    </div>
  );
}

export default function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="muted">No revenue data yet.</p>;
  }

  // Keep the chart readable: show the top 8 products by revenue (data already
  // arrives sorted highest-first from the backend).
  const top = data.slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={top} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        {/* Recessive horizontal-only grid; hairline color from CSS var */}
        <CartesianGrid stroke="var(--gridline)" vertical={false} />
        <XAxis
          dataKey="title"
          tick={{ fill: 'var(--muted)', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--baseline)' }}
          interval={0}
          height={60}
          angle={-20}
          textAnchor="end"
        />
        <YAxis
          tick={{ fill: 'var(--muted)', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatMoney(v)}
          width={80}
        />
        <Tooltip cursor={{ fill: 'var(--hover-wash)' }} content={<MoneyTooltip />} />
        {/* radius rounds only the top of each bar (data-end) */}
        <Bar dataKey="revenue" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  );
}
