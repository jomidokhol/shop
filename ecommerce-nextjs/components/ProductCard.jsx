'use client';
import { useRouter } from 'next/navigation';

function formatNumber(num) {
  if (!num) return '0';
  const n = parseFloat(num);
  if (isNaN(n)) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

export default function ProductCard({ product }) {
  const router = useRouter();
  if (!product) return null;

  const image = (product.images && product.images[0]) || product.image || '';
  const price = product.price || 0;
  const originalPrice = product.originalPrice || price;
  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const isOutOfStock = product.status === 'Out of Stock';

  return (
    <div
      className="product-card"
      onClick={() => router.push(`/product/${product.id}`)}
    >
      <div className="img-frame">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="product-img"
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '2rem' }}>
            <i className="fas fa-image" />
          </div>
        )}
        {discount > 0 && (
          <div className="off-badge">{discount}% OFF</div>
        )}
        {isOutOfStock && (
          <div className="out-of-stock-banner">Out of Stock</div>
        )}
      </div>
      <div className="card-info">
        <div className="product-title">{product.name}</div>
        <div className="price-group">
          <span className="new-price">৳{price.toFixed(0)}</span>
          {originalPrice > price && (
            <span className="old-price">৳{originalPrice.toFixed(0)}</span>
          )}
        </div>
        {product.sold > 0 && (
          <div className="sales-section">
            <i className="fas fa-fire" style={{ color: 'var(--secondary)', marginRight: 3 }} />
            {formatNumber(product.sold)} sold
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #f3f4f6', padding: 10 }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '6/8', borderRadius: 8 }} />
      <div style={{ padding: '10px 0 0' }}>
        <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
      </div>
    </div>
  );
}
