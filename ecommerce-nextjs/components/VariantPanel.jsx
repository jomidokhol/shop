'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { showNotification } from './Notification';

export default function VariantPanel({ product, mode, onClose }) {
  // mode: 'cart' | 'buy'
  const { addToCart } = useCart();
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const variants = product?.variants || [];
  const hasVariants = variants.length > 0;

  // Derived price from selected variant
  const currentVariant = hasVariants && selectedColor
    ? variants.find(v => v.color === selectedColor)
    : null;

  const sizeOptions = currentVariant?.sizes || [];
  const currentSize = sizeOptions.find(s => s.size === selectedSize);

  const price = currentSize?.price || currentVariant?.price || product?.price || 0;
  const image = currentVariant?.imageUrl || (product?.images && product.images[0]) || product?.image || '';

  useEffect(() => {
    if (variants.length > 0 && !selectedColor) {
      setSelectedColor(variants[0].color);
    }
  }, [variants]);

  useEffect(() => {
    if (sizeOptions.length > 0 && !selectedSize) {
      setSelectedSize(sizeOptions[0].size);
    }
  }, [selectedColor, sizeOptions]);

  const handleConfirm = () => {
    if (hasVariants && !selectedColor) {
      showNotification('Please select a color');
      return;
    }
    if (sizeOptions.length > 0 && !selectedSize) {
      showNotification('Please select a size');
      return;
    }

    const variant = currentVariant
      ? { color: selectedColor, size: selectedSize || 'N/A', price, imageUrl: currentVariant.imageUrl }
      : null;

    addToCart(product, quantity, variant);
    showNotification(`${product.name} added to cart!`);
    onClose();
  };

  if (!product) return null;

  return (
    <>
      <div className="options-panel-overlay active" onClick={onClose} />
      <div className="options-panel active" style={{ maxHeight: '85vh' }}>
        {/* Product Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid #eee' }}>
          <img
            src={image}
            alt={product.name}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{product.name}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>৳{price.toFixed(0)}</div>
          </div>
          <button className="options-panel-close" onClick={onClose}>×</button>
        </div>

        {/* Color Selector */}
        {hasVariants && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>
              Color: <span style={{ color: 'var(--primary)' }}>{selectedColor}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {variants.map(v => (
                <button
                  key={v.color}
                  onClick={() => { setSelectedColor(v.color); setSelectedSize(null); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `2px solid ${selectedColor === v.color ? 'var(--primary)' : '#d1d5db'}`,
                    background: selectedColor === v.color ? '#f0fdf4' : 'white',
                    color: selectedColor === v.color ? 'var(--primary)' : 'var(--dark)',
                    fontWeight: selectedColor === v.color ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {v.color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size Selector */}
        {sizeOptions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>
              Size: <span style={{ color: 'var(--primary)' }}>{selectedSize}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sizeOptions.map(s => (
                <button
                  key={s.size}
                  onClick={() => setSelectedSize(s.size)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `2px solid ${selectedSize === s.size ? 'var(--primary)' : '#d1d5db'}`,
                    background: selectedSize === s.size ? '#f0fdf4' : 'white',
                    color: selectedSize === s.size ? 'var(--primary)' : 'var(--dark)',
                    fontWeight: selectedSize === s.size ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div style={{ marginBottom: 20, paddingTop: 15, borderTop: '1px solid #eee' }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Quantity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
            <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 600, fontSize: '1.1rem' }}>{quantity}</span>
            <button className="qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
          </div>
        </div>

        {/* Confirm */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}
          onClick={handleConfirm}
        >
          {mode === 'buy' ? 'Buy Now' : 'Add to Cart'}
        </button>
      </div>
    </>
  );
}
