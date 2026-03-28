'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const barcodeRef = useRef(null);
  const [orderId, setOrderId] = useState('');
  const [total, setTotal] = useState('0');
  const [payment, setPayment] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem('last_order_id');
    const t = sessionStorage.getItem('last_order_total');
    const p = sessionStorage.getItem('last_order_payment');
    if (!id) { router.push('/'); return; }
    setOrderId(id);
    setTotal(t || '0');
    setPayment(p || '');

    // Generate barcode
    if (typeof window !== 'undefined') {
      import('jsbarcode').then(({ default: JsBarcode }) => {
        if (barcodeRef.current && id) {
          try {
            JsBarcode(barcodeRef.current, id, {
              format: 'CODE128', width: 2, height: 50, displayValue: true,
              font: 'Poppins', fontSize: 12,
            });
          } catch (e) { /* ignore */ }
        }
      }).catch(() => {});
    }
  }, []);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadReceipt = async () => {
    if (typeof window === 'undefined') return;
    const { default: html2canvas } = await import('html2canvas');
    const el = document.getElementById('receipt-card');
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.9);
    a.download = `Order-${orderId}.jpg`;
    a.click();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 15px' }}>
      <div id="receipt-card" style={{ background: 'white', borderRadius: 16, padding: 30, maxWidth: 420, width: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
        {/* Success Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%', background: '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '2rem', color: '#16a34a',
          }}>
            <i className="fas fa-check" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', marginBottom: 6 }}>Order Placed!</h2>
          <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Thank you for your purchase. We'll process it shortly.</p>
        </div>

        {/* Summary */}
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          {[
            { label: 'Order No.', value: orderId, action: copyOrderId, actionLabel: copied ? '✓ Copied' : 'Copy' },
            { label: 'Total Amount', value: `৳${parseFloat(total).toFixed(0)}` },
            { label: 'Payment Method', value: payment || 'N/A' },
            { label: 'Date', value: new Date().toLocaleDateString('en-BD') },
          ].map(({ label, value, action, actionLabel }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--gray)' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{value}</span>
                {action && (
                  <button
                    onClick={action}
                    style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Barcode */}
        {orderId && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <svg ref={barcodeRef} />
          </div>
        )}

        {/* Status Steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 14, left: '10%', right: '10%', height: 2, background: '#e5e7eb', zIndex: 0 }} />
          {['Order Placed', 'Processing', 'Shipping', 'Delivered'].map((step, i) => (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i === 0 ? '#166534' : '#e5e7eb',
                color: i === 0 ? 'white' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                {i === 0 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.65rem', color: i === 0 ? '#166534' : '#9ca3af', textAlign: 'center', fontWeight: i === 0 ? 600 : 400, maxWidth: 60 }}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons (outside receipt card for clean download) */}
      <div style={{ maxWidth: 420, width: '100%', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link href="/" className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '1rem', justifyContent: 'center' }}>
          Continue Shopping
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/profile/orders" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
            <i className="fas fa-receipt" /> My Orders
          </Link>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={downloadReceipt}>
            <i className="fas fa-download" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
