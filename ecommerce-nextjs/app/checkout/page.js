'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Notification, { showNotification } from '@/components/Notification';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { selectedItems, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const { settings } = useShop();

  const [address, setAddress] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [gatewayNumber, setGatewayNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [gateways, setGateways] = useState([]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    try {
      const addr = JSON.parse(sessionStorage.getItem('checkout_address') || 'null');
      if (!addr) { router.push('/order-summary'); return; }
      setAddress(addr);
      setSubtotal(parseFloat(sessionStorage.getItem('checkout_subtotal') || '0'));
      setShippingFee(parseFloat(sessionStorage.getItem('checkout_shipping') || '0'));
      setDiscount(parseFloat(sessionStorage.getItem('checkout_discount') || '0'));
    } catch (e) { router.push('/order-summary'); }

    // Load payment gateways from settings
    if (settings.paymentGateways && settings.paymentGateways.length > 0) {
      setGateways(settings.paymentGateways);
      setPaymentMethod(settings.paymentGateways[0]?.name || 'COD');
    } else {
      setGateways([{ name: 'COD', label: 'Cash on Delivery', icon: 'fas fa-money-bill-wave' }]);
    }
  }, [user, settings]);

  if (!user || !address) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Notification />
      <div style={{ textAlign: 'center' }}>
        <div className="skeleton" style={{ width: 300, height: 400, borderRadius: 16 }} />
      </div>
    </div>
  );

  const codFee = paymentMethod === 'COD' ? settings.codHandlingFee : 0;
  const total = subtotal + shippingFee - discount + codFee;
  const isCOD = paymentMethod === 'COD';
  const needsGatewayDetails = !isCOD;

  const placeOrder = async () => {
    if (needsGatewayDetails && (!gatewayNumber || !trxId)) {
      showNotification('Please enter your mobile number and Transaction ID'); return;
    }

    const orderId = 'ORD-' + Date.now().toString().slice(-8);
    setPlacing(true);

    try {
      const cartItems = selectedItems.map(item => ({
        id: item.id,
        pid: item.pid || item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        qty: item.quantity,
        color: item.color,
        size: item.size,
      }));

      await addDoc(collection(db, 'orders'), {
        id: orderId,
        userId: user.uid,
        customer: address.name,
        phone: address.phone,
        email: address.email || user.email || '',
        address: `${address.address}, ${address.region} - ${address.postcode}`,
        region: address.region,
        payment: paymentMethod,
        paymentMobile: gatewayNumber || '',
        trxId: trxId || '',
        status: isCOD ? 'Pending' : 'Processing',
        amount: total,
        subtotal,
        shippingFee,
        codFee,
        discount,
        cartItems,
        date: new Date().toLocaleDateString('en-BD'),
        createdAt: Timestamp.now(),
      });

      clearCart();
      sessionStorage.removeItem('checkout_address');
      sessionStorage.removeItem('checkout_subtotal');
      sessionStorage.removeItem('checkout_shipping');
      sessionStorage.removeItem('checkout_discount');

      // Store order for confirmation page
      sessionStorage.setItem('last_order_id', orderId);
      sessionStorage.setItem('last_order_total', total.toString());
      sessionStorage.setItem('last_order_payment', paymentMethod);

      router.push('/order-confirmation');
    } catch (e) {
      console.error(e);
      showNotification('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Notification />

      {/* Payment Header */}
      <div style={{ background: 'var(--payment-theme-color)', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 15 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
          <i className="fas fa-arrow-left" />
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Secure Checkout</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{settings.siteName}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Amount</div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>৳{total.toFixed(0)}</div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 15px' }}>

        {/* Order Items Summary */}
        <div style={{ background: 'white', borderRadius: 12, marginBottom: 15, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>
            Order Items
          </div>
          {selectedItems.map(item => (
            <div key={item.cartId} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f9f9f9' }}>
              <img src={item.image} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.88rem', marginBottom: 2 }}>{item.name}</div>
                {(item.color !== 'N/A' || item.size !== 'N/A') && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                    {item.color !== 'N/A' && item.color} {item.size !== 'N/A' && `/ ${item.size}`}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                ৳{(item.price * item.quantity).toFixed(0)}
                <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 400 }}>×{item.quantity}</div>
              </div>
            </div>
          ))}

          {/* Price breakdown */}
          <div style={{ padding: '12px 16px', background: '#f9fafb' }}>
            {[
              { l: 'Subtotal', v: `৳${subtotal.toFixed(0)}` },
              { l: 'Shipping', v: `৳${shippingFee.toFixed(0)}` },
              discount > 0 && { l: 'Coupon Discount', v: `-৳${discount.toFixed(0)}`, c: '#10b981' },
              codFee > 0 && { l: 'COD Handling Fee', v: `৳${codFee.toFixed(0)}` },
            ].filter(Boolean).map(({ l, v, c }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.88rem', color: c || '#6b7280' }}>
                <span>{l}</span>
                <span style={{ fontWeight: 500, color: c || 'var(--dark)' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', borderTop: '1px solid #eee', paddingTop: 10, marginTop: 6 }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>৳{total.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.95rem' }}>
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)', marginRight: 8 }} />
            Delivering To
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            <div style={{ fontWeight: 600 }}>{address.name} — {address.phone}</div>
            <div style={{ color: '#4b5563', marginTop: 3 }}>{address.address}</div>
            <div style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>{address.region} — {address.postcode}</div>
          </div>
        </div>

        {/* Payment Method */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.95rem' }}>
            <i className="fas fa-credit-card" style={{ color: 'var(--primary)', marginRight: 8 }} />
            Payment Method
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* COD option */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              border: `2px solid ${paymentMethod === 'COD' ? 'var(--primary)' : '#e5e7eb'}`,
              background: paymentMethod === 'COD' ? '#f0fdf4' : 'white',
              cursor: 'pointer',
            }}>
              <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{ accentColor: 'var(--primary)' }} />
              <i className="fas fa-money-bill-wave" style={{ color: '#16a34a', fontSize: '1.2rem' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cash on Delivery</div>
                {codFee > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>+৳{codFee} handling fee</div>}
              </div>
            </label>

            {/* Custom gateways */}
            {gateways.filter(g => g.name !== 'COD').map(gw => (
              <label
                key={gw.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  border: `2px solid ${paymentMethod === gw.name ? 'var(--primary)' : '#e5e7eb'}`,
                  background: paymentMethod === gw.name ? '#f0fdf4' : 'white',
                  cursor: 'pointer',
                }}
              >
                <input type="radio" name="payment" value={gw.name} checked={paymentMethod === gw.name} onChange={() => setPaymentMethod(gw.name)} style={{ accentColor: 'var(--primary)' }} />
                {gw.logoUrl
                  ? <img src={gw.logoUrl} alt={gw.name} style={{ height: 28, objectFit: 'contain' }} />
                  : <i className={gw.icon || 'fas fa-wallet'} style={{ fontSize: '1.2rem', color: 'var(--primary)' }} />
                }
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{gw.name}</div>
                  {gw.number && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>Send to: {gw.number}</div>}
                </div>
              </label>
            ))}
          </div>

          {/* Gateway input fields */}
          {needsGatewayDetails && (
            <div style={{ marginTop: 15, padding: 15, background: '#f9fafb', borderRadius: 10 }}>
              <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: 12 }}>
                Please send ৳{total.toFixed(0)} to the number above, then enter your details:
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Your Mobile Number *</label>
                <input className="form-control" value={gatewayNumber} onChange={e => setGatewayNumber(e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Transaction ID *</label>
                <input className="form-control" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="e.g. ABC1234567" />
              </div>
            </div>
          )}
        </div>

        {/* Place Order Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: 12, position: 'relative', overflow: 'hidden' }}
          onClick={placeOrder}
          disabled={placing}
        >
          {placing ? (
            <span><i className="fas fa-spinner fa-spin" /> Placing Order...</span>
          ) : (
            <span><i className="fas fa-lock" /> Place Order — ৳{total.toFixed(0)}</span>
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray)', marginTop: 15 }}>
          <i className="fas fa-shield-alt" style={{ marginRight: 4 }} />
          Secure & encrypted checkout
        </p>
      </div>
    </div>
  );
}
