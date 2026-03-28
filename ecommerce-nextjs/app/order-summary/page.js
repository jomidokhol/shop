'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Notification, { showNotification } from '@/components/Notification';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';

function AddressForm({ onSave, onCancel, initial }) {
  const [form, setForm] = useState(initial || { title: '', name: '', phone: '', email: '', region: 'Inside Dhaka', postcode: '', address: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ background: '#f9fafb', padding: 20, borderRadius: 10, border: '1px solid #eee' }}>
      <h4 style={{ marginBottom: 15, fontWeight: 600 }}>{initial ? 'Edit Address' : 'Add New Address'}</h4>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Title (e.g. Home)</label>
          <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Home" />
        </div>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Mobile Number *</label>
          <input className="form-control" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Region *</label>
          <select className="form-control" value={form.region} onChange={e => set('region', e.target.value)}>
            <option>Inside Dhaka</option>
            <option>Outside Dhaka</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Post Code *</label>
          <input className="form-control" type="number" value={form.postcode} onChange={e => set('postcode', e.target.value)} placeholder="1205" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Full Address *</label>
        <textarea className="form-control" rows={3} value={form.address} onChange={e => set('address', e.target.value)} placeholder="House, Road, Area, Thana" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-outline" type="button" onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!form.name || !form.phone || !form.address || !form.postcode) {
              showNotification('Please fill required fields'); return;
            }
            onSave(form);
          }}
        >
          Save Address
        </button>
      </div>
    </div>
  );
}

export default function OrderSummaryPage() {
  const router = useRouter();
  const { cart, selectedItems, subtotal, setIsCartOpen } = useCart();
  const { user, userProfile } = useAuth();
  const { settings } = useShop();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  // Load addresses from profile
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`addresses_${user.uid}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setAddresses(parsed);
      const def = parsed.find(a => a.isDefault) || parsed[0];
      if (def) setSelectedAddress(def);
    }
  }, [user]);

  if (!user) return null;

  const shippingFee = selectedAddress?.region === 'Outside Dhaka' ? settings.deliveryOutside : settings.deliveryInside;
  const total = subtotal + shippingFee - couponDiscount;

  const saveAddress = (form) => {
    const newAddr = { ...form, id: Date.now().toString(), isDefault: addresses.length === 0 };
    const updated = [...addresses, newAddr];
    setAddresses(updated);
    if (user) localStorage.setItem(`addresses_${user.uid}`, JSON.stringify(updated));
    setSelectedAddress(newAddr);
    setShowAddressForm(false);
    showNotification('Address saved!');
  };

  const handleCoupon = () => {
    // Placeholder coupon logic — connect to Firestore coupons collection
    if (coupon.toLowerCase() === 'discount10') {
      const disc = Math.round(subtotal * 0.1);
      setCouponDiscount(disc);
      showNotification(`Coupon applied! -৳${disc}`);
    } else {
      showNotification('Invalid coupon code');
    }
  };

  const proceed = () => {
    if (selectedItems.length === 0) { showNotification('Please select items to checkout'); return; }
    if (!selectedAddress) { setShowAddressForm(true); showNotification('Please add a delivery address'); return; }
    // Store checkout data
    sessionStorage.setItem('checkout_address', JSON.stringify(selectedAddress));
    sessionStorage.setItem('checkout_subtotal', subtotal.toString());
    sessionStorage.setItem('checkout_shipping', shippingFee.toString());
    sessionStorage.setItem('checkout_discount', couponDiscount.toString());
    router.push('/checkout');
  };

  return (
    <>
      <Header />
      <CartDrawer />
      <Notification />

      <main style={{ minHeight: '80vh', background: '#f9fafb', paddingBottom: 40 }}>
        <div className="container" style={{ paddingTop: 25 }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', fontFamily: 'Poppins, sans-serif' }}>
            <i className="fas fa-arrow-left" /> Back
          </button>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 20 }}>Order Summary</h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Left: Items + Address */}
            <div>
              {/* Selected Items */}
              <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontWeight: 600, marginBottom: 15 }}>
                  <i className="fas fa-box" style={{ color: 'var(--primary)', marginRight: 8 }} />
                  Items ({selectedItems.length})
                </h3>
                {selectedItems.length === 0 ? (
                  <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px 0' }}>
                    <p>No items selected.</p>
                    <button className="btn btn-outline" style={{ marginTop: 10 }} onClick={() => setIsCartOpen(true)}>
                      Open Cart
                    </button>
                  </div>
                ) : (
                  selectedItems.map(item => {
                    const orig = item.originalPrice || item.price;
                    const disc = orig > item.price ? Math.round(((orig - item.price) / orig) * 100) : 0;
                    return (
                      <div key={item.cartId} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <img src={item.image} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 3 }}>{item.name}</div>
                          {(item.color !== 'N/A' || item.size !== 'N/A') && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 3 }}>
                              {item.color !== 'N/A' && `Color: ${item.color}`}
                              {item.color !== 'N/A' && item.size !== 'N/A' && ' | '}
                              {item.size !== 'N/A' && `Size: ${item.size}`}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>৳{item.price.toFixed(0)}</span>
                            {disc > 0 && <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>-{disc}%</span>}
                            <span style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>× {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Delivery Address */}
              <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <h3 style={{ fontWeight: 600 }}>
                    <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)', marginRight: 8 }} />
                    Delivery Address
                  </h3>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '5px 12px', fontSize: '0.85rem' }}
                    onClick={() => setShowAddressForm(f => !f)}
                  >
                    + Add
                  </button>
                </div>

                {showAddressForm && (
                  <div style={{ marginBottom: 15 }}>
                    <AddressForm onSave={saveAddress} onCancel={() => setShowAddressForm(false)} />
                  </div>
                )}

                {addresses.length === 0 && !showAddressForm && (
                  <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>
                    No addresses saved. Add one to continue.
                  </div>
                )}

                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    style={{
                      padding: 14, borderRadius: 10, marginBottom: 10,
                      border: `2px solid ${selectedAddress?.id === addr.id ? 'var(--primary)' : '#e5e7eb'}`,
                      background: selectedAddress?.id === addr.id ? '#f0fdf4' : 'white',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        {addr.title && <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', borderRadius: 10, padding: '2px 8px', marginRight: 8 }}>{addr.title.toUpperCase()}</span>}
                        <span style={{ fontWeight: 600 }}>{addr.name}</span>
                        <span style={{ color: 'var(--gray)', fontSize: '0.85rem', marginLeft: 8 }}>{addr.phone}</span>
                      </div>
                      {selectedAddress?.id === addr.id && <i className="fas fa-check-circle" style={{ color: 'var(--primary)' }} />}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: 5 }}>{addr.address}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginTop: 2 }}>{addr.region} — {addr.postcode}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Price Summary */}
            <div>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 90 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Price Details</h3>

                {/* Coupon */}
                <div className="coupon-row" style={{ marginBottom: 20 }}>
                  <input
                    className="form-control"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    placeholder="Coupon code"
                  />
                  <button className="btn btn-outline" onClick={handleCoupon} style={{ padding: '8px 16px' }}>
                    Apply
                  </button>
                </div>

                {[
                  { label: `Subtotal (${selectedItems.length} items)`, value: `৳${subtotal.toFixed(0)}` },
                  { label: `Shipping (${selectedAddress?.region || 'Inside Dhaka'})`, value: `৳${shippingFee.toFixed(0)}` },
                  couponDiscount > 0 && { label: 'Coupon Discount', value: `-৳${couponDiscount.toFixed(0)}`, color: '#10b981' },
                ].filter(Boolean).map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.95rem', color: color || '#4b5563' }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 500, color: color || 'var(--dark)' }}>{value}</span>
                  </div>
                ))}

                <div style={{ borderTop: '2px solid #eee', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>৳{total.toFixed(0)}</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}
                  onClick={proceed}
                  disabled={selectedItems.length === 0}
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
