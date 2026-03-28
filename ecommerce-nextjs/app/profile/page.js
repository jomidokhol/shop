'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Notification, { showNotification } from '@/components/Notification';
import { useAuth } from '@/context/AuthContext';

function OrderCard({ order }) {
  const statusColors = {
    'Pending': { bg: '#fef3c7', color: '#d97706' },
    'Processing': { bg: '#dbeafe', color: '#2563eb' },
    'Shipped': { bg: '#e0e7ff', color: '#4338ca' },
    'Delivered': { bg: '#dcfce7', color: '#16a34a' },
    'Cancelled': { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = statusColors[order.status] || { bg: '#f3f4f6', color: '#6b7280' };

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{order.id}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: 2 }}>{order.date}</div>
        </div>
        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, height: 'fit-content' }}>
          {order.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10 }}>
        {(order.cartItems || []).slice(0, 4).map((item, i) => (
          <img key={i} src={item.image} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid #f3f4f6' }} />
        ))}
        {(order.cartItems || []).length > 4 && (
          <div style={{ width: 50, height: 50, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--gray)', flexShrink: 0 }}>
            +{order.cartItems.length - 4}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{order.cartItems?.length || 0} item(s)</div>
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>৳{order.amount}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {order.status === 'Pending' && (
            <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={async () => {
                if (!confirm('Cancel this order?')) return;
                try {
                  await updateDoc(doc(db, 'orders', order.docId || order.id), { status: 'Cancelled' });
                  showNotification('Order cancelled');
                  window.location.reload();
                } catch { showNotification('Failed to cancel'); }
              }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, logout, refreshProfile } = useAuth();
  const [tab, setTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', gender: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    setProfileForm({ name: userProfile?.name || '', phone: userProfile?.phone || '', gender: userProfile?.gender || '' });
    const stored = localStorage.getItem(`addresses_${user.uid}`);
    if (stored) setAddresses(JSON.parse(stored));
  }, [user, userProfile]);

  useEffect(() => {
    if (tab === 'orders' && user && orders.length === 0) loadOrders();
  }, [tab, user]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')));
      const ords = [];
      snap.forEach(d => ords.push({ docId: d.id, ...d.data() }));
      setOrders(ords);
    } catch (e) { console.error(e); } finally { setLoadingOrders(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), profileForm);
      await refreshProfile();
      showNotification('Profile updated!');
    } catch { showNotification('Failed to update profile'); } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'orders', label: 'Orders', icon: 'fas fa-receipt' },
    { id: 'addresses', label: 'Addresses', icon: 'fas fa-map-marker-alt' },
  ];

  return (
    <>
      <Header />
      <CartDrawer />
      <Notification />

      <main style={{ background: '#f9fafb', minHeight: '80vh', paddingBottom: 60 }}>
        {/* Profile Header */}
        <div style={{ background: 'linear-gradient(135deg, #166534, #14532d)', color: 'white', padding: '30px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
              <i className="fas fa-user" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: 4 }}>{userProfile?.name || 'User'}</h2>
              <div style={{ opacity: 0.85, fontSize: '0.9rem' }}>{user.email}</div>
              {userProfile?.phone && <div style={{ opacity: 0.75, fontSize: '0.85rem', marginTop: 2 }}>{userProfile.phone}</div>}
            </div>
            <button
              onClick={handleLogout}
              style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Poppins, sans-serif' }}
            >
              <i className="fas fa-sign-out-alt" /> Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 70, zIndex: 90 }}>
          <div className="container" style={{ display: 'flex' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif', fontWeight: tab === t.id ? 600 : 400,
                  color: tab === t.id ? 'var(--primary)' : 'var(--gray)',
                  borderBottom: `3px solid ${tab === t.id ? 'var(--primary)' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
              >
                <i className={t.icon} />
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="container" style={{ paddingTop: 25 }}>
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 25, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Profile Information</h3>
                <form onSubmit={saveProfile}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-control" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-control" type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-control" value={user.email} disabled style={{ background: '#f9fafb', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select className="form-control" value={profileForm.gender} onChange={e => setProfileForm(f => ({ ...f, gender: e.target.value }))}>
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {tab === 'orders' && (
            <div style={{ maxWidth: 640 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 20 }}>My Orders</h3>
              {loadingOrders ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 12 }} />
                ))
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-receipt" />
                  <h3>No orders yet</h3>
                  <p>Your order history will appear here</p>
                  <button className="btn btn-primary" style={{ marginTop: 15 }} onClick={() => router.push('/')}>
                    Start Shopping
                  </button>
                </div>
              ) : (
                orders.map(o => <OrderCard key={o.id} order={o} />)
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {tab === 'addresses' && (
            <div style={{ maxWidth: 560 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Saved Addresses</h3>
              {addresses.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-map-marker-alt" />
                  <h3>No addresses saved</h3>
                  <p>Add an address when checking out</p>
                </div>
              ) : (
                addresses.map(addr => (
                  <div key={addr.id} style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {addr.title && <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', borderRadius: 10, padding: '2px 8px' }}>{addr.title.toUpperCase()}</span>}
                        <span style={{ fontWeight: 600 }}>{addr.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = addresses.filter(a => a.id !== addr.id);
                          setAddresses(updated);
                          localStorage.setItem(`addresses_${user.uid}`, JSON.stringify(updated));
                          showNotification('Address removed');
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{addr.phone}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginTop: 4 }}>{addr.address}, {addr.region} — {addr.postcode}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 576px) { .tab-label { display: none; } }
      `}</style>
    </>
  );
}
