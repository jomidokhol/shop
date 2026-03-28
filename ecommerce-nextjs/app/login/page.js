'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Notification, { showNotification } from '@/components/Notification';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { showNotification('Please fill all fields'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many failed attempts. Try again later.',
      };
      showNotification(messages[err.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Create/update profile
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name: user.displayName || '',
          email: user.email || '',
          createdAt: Timestamp.now(),
        });
      }
      router.push('/');
    } catch (err) {
      showNotification('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', padding: '20px 15px' }}>
      <Notification />
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 35px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.8rem', color: 'var(--primary)', border: '3px solid #bbf7d0' }}>
            <i className="fas fa-user" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #d1d5db',
            background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, marginBottom: 20, fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '0.95rem',
            transition: 'box-shadow 0.2s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                className="form-control"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPw(s => !s)}
              >
                <i className={`fas fa-eye${showPw ? '-slash' : ''}`} />
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <Link href="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? <><i className="fas fa-spinner fa-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--gray)' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
