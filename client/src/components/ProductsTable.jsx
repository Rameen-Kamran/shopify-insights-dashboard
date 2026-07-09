// ProductsTable.jsx — a plain HTML table of products from Shopify.
// We only pull out a few useful fields from each product object.

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0);
}

// A Shopify product has a "variants" array; the first variant's price is a
// reasonable "from" price to show in a simple table.
function firstVariantPrice(product) {
  const variant = product.variants && product.variants[0];
  return variant ? parseFloat(variant.price) : 0;
}

export default function ProductsTable({ products }) {
  if (!products || products.length === 0) {
    return <p className="muted">No products found.</p>;
  }

  return (
    <table className="products-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Type</th>
          <th>Status</th>
          <th className="num">Price</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td>{p.title}</td>
            <td>{p.product_type || '—'}</td>
            <td>{p.status || '—'}</td>
            <td className="num">{formatMoney(firstVariantPrice(p))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
