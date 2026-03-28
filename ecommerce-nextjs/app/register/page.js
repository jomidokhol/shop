'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Notification, { showNotification } from '@/components/Notification';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { showNotification('Please fill all required fields'); return; }
    if (form.password.length < 6) { showNotification('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { showNotification('Passwords do not match'); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone || '',
        createdAt: Timestamp.now(),
      });
      router.push('/');
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password is too weak.',
        'auth/invalid-email': 'Invalid email address.',
      };
      showNotification(messages[err.code] || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', padding: '20px 15px' }}>
      <Notification />
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 35px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.8rem', color: 'var(--primary)', border: '3px solid #bbf7d0' }}>
            <i className="fas fa-user-plus" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 6 }}>Create Account</h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Join us and start shopping</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="password-wrapper">
                <input
                  className="form-control"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  style={{ paddingRight: 40 }}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPw(s => !s)}>
                  <i className={`fas fa-eye${showPw ? '-slash' : ''}`} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                className="form-control"
                type={showPw ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '1rem', marginTop: 10 }}
            disabled={loading}
          >
            {loading ? <><i className="fas fa-spinner fa-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--gray)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
