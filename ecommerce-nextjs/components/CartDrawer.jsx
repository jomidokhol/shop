'use client';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart, cartCount, subtotal,
    isCartOpen, setIsCartOpen,
    removeFromCart, updateQuantity, toggleSelect, toggleSelectAll,
  } = useCart();

  const selectedCount = cart.filter(i => i.selected).length;
  const allSelected = cart.length > 0 && selectedCount === cart.length;

  const goToCheckout = () => {
    setIsCartOpen(false);
    router.push('/order-summary');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay${isCartOpen ? ' active' : ''}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className={`cart-drawer${isCartOpen ? ' open' : ''}`}>
        <div className="cart-header">
          <h2><i className="fas fa-shopping-cart" style={{ marginRight: 8, color: 'var(--primary)' }} />
            Cart ({cartCount})
          </h2>
          <button className="cart-close" onClick={() => setIsCartOpen(false)}>×</button>
        </div>

        {/* Select All */}
        {cart.length > 0 && (
          <div style={{ padding: '8px 15px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={e => toggleSelectAll(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
              Select All ({selectedCount}/{cart.length})
            </span>
          </div>
        )}

        {/* Items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <i className="fas fa-shopping-cart" style={{ fontSize: '3rem', color: '#e5e7eb' }} />
              <p>Your cart is empty</p>
              <button className="btn btn-primary" onClick={() => setIsCartOpen(false)}>
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartId} className="cart-item">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleSelect(item.cartId)}
                  style={{ accentColor: 'var(--primary)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0, marginTop: 4 }}
                />
                <img src={item.image || '/placeholder.png'} alt={item.name} />
                <div className="cart-item-info" style={{ flex: 1 }}>
                  <div className="cart-item-name">{item.name}</div>
                  {(item.color !== 'N/A' || item.size !== 'N/A') && (
                    <div className="cart-item-variant">
                      {item.color !== 'N/A' && `Color: ${item.color}`}
                      {item.color !== 'N/A' && item.size !== 'N/A' && ' | '}
                      {item.size !== 'N/A' && `Size: ${item.size}`}
                    </div>
                  )}
                  <div className="cart-item-price">৳{item.price.toFixed(0)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQuantity(item.cartId, item.quantity - 1)}>−</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>+</button>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.cartId)}
                      title="Remove"
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Subtotal ({selectedCount} items)</span>
              <span style={{ color: 'var(--primary)' }}>৳{subtotal.toFixed(0)}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={goToCheckout}
              disabled={selectedCount === 0}
              style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            >
              Checkout ({selectedCount} items)
            </button>
          </div>
        )}
      </div>
    </>
  );
}
