'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) { /* ignore */ }
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) { /* ignore */ }
  }, [cart]);

  const addToCart = useCallback((product, quantity = 1, variant = null) => {
    const color = variant?.color || 'N/A';
    const size = variant?.size || 'N/A';
    const cartId = `${product.id}-${color}-${size}`;
    const price = variant?.price || product.price || 0;
    const image = variant?.imageUrl || (product.images && product.images[0]) || product.image || '';

    setCart(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev.map(i =>
          i.cartId === cartId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, {
        cartId,
        id: product.id,
        pid: product.pid || product.id,
        name: product.name,
        price,
        originalPrice: product.originalPrice || price,
        image,
        quantity,
        color,
        size,
        selected: true,
      }];
    });
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId, quantity) => {
    if (quantity < 1) return;
    setCart(prev =>
      prev.map(i => i.cartId === cartId ? { ...i, quantity } : i)
    );
  }, []);

  const toggleSelect = useCallback((cartId) => {
    setCart(prev =>
      prev.map(i => i.cartId === cartId ? { ...i, selected: !i.selected } : i)
    );
  }, []);

  const toggleSelectAll = useCallback((selectAll) => {
    setCart(prev => prev.map(i => ({ ...i, selected: selectAll })));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const selectedItems = cart.filter(i => i.selected);
  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, cartCount, selectedItems, subtotal,
      addToCart, removeFromCart, updateQuantity,
      toggleSelect, toggleSelectAll, clearCart,
      isCartOpen, setIsCartOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
