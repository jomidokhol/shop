'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';

export default function Header() {
  const router = useRouter();
  const { cartCount, setIsCartOpen } = useCart();
  const { user, userProfile, logout } = useAuth();
  const { settings } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHome, setIsHome] = useState(false);

  useEffect(() => {
    setIsHome(window.location.pathname === '/');
    const handleScroll = () => {
      if (window.location.pathname === '/') {
        setScrolled(window.scrollY > 60);
      } else {
        setScrolled(true);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsHome(window.location.pathname === '/');
    setScrolled(window.location.pathname !== '/');
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push('/');
  };

  const atTop = isHome && !scrolled;

  return (
    <header style={{
      backgroundColor: atTop ? 'transparent' : 'white',
      boxShadow: atTop ? 'none' : 'var(--shadow)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.4s ease, box-shadow 0.4s ease',
    }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 70 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', maxWidth: 180 }}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: 35, width: 'auto', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontWeight: 700, fontSize: '1.2rem', color: atTop ? 'white' : 'var(--primary)' }}>
                {settings.siteName}
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Search Icon */}
            <Link href="/search" style={{ color: atTop ? 'white' : 'var(--dark)', fontSize: '1.1rem' }}>
              <i className="fas fa-search" />
            </Link>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: atTop ? 'white' : 'var(--dark)', fontSize: '1.1rem' }}
            >
              <i className="fas fa-shopping-cart" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -8, right: -8,
                  background: 'var(--secondary)', color: 'white',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Auth Buttons (desktop) */}
            <div style={{ display: 'flex', gap: 10 }} className="desktop-auth">
              {user ? (
                <button
                  onClick={() => router.push('/profile')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: atTop ? 'white' : 'var(--dark)', fontSize: '1.1rem',
                  }}
                >
                  <i className="fas fa-user-circle" />
                </button>
              ) : (
                <>
                  <Link href="/login" className="btn btn-outline" style={atTop ? { color: 'white', borderColor: 'white' } : {}}>
                    Login
                  </Link>
                  <Link href="/register" className="btn btn-primary">Register</Link>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <div style={{ width: 24, height: 18, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    display: 'block', height: 3, background: atTop ? 'white' : 'var(--dark)',
                    borderRadius: 2, transition: '0.3s',
                    transform: menuOpen && i === 0 ? 'rotate(-45deg) translate(-5px, 6px)'
                      : menuOpen && i === 1 ? 'scaleX(0)'
                        : menuOpen && i === 2 ? 'rotate(45deg) translate(-5px, -6px)'
                          : 'none',
                  }} />
                ))}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{
            background: 'white', padding: '20px', borderTop: '1px solid #eee',
            animation: 'fadeIn 0.2s ease',
          }}>
            {user && (
              <div style={{ textAlign: 'center', paddingBottom: 15, marginBottom: 15, borderBottom: '1px solid #eee' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#f0fdf4', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '1.4rem', border: '2px solid var(--primary)' }}>
                  <i className="fas fa-user" />
                </div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{userProfile?.name || user.email}</div>
                <Link href="/profile" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
                  My Profile
                </Link>
              </div>
            )}

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { href: '/', label: 'Home' },
                { href: '/search', label: 'Search' },
                { href: '/#shop', label: 'Shop' },
                { href: '/#categories', label: 'Categories' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ padding: '12px 0', color: 'var(--dark)', textDecoration: 'none', fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {user ? (
                <button className="btn btn-outline" onClick={handleLogout} style={{ width: '100%' }}>
                  <i className="fas fa-sign-out-alt" /> Logout
                </button>
              ) : (
                <>
                  <Link href="/login" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link href="/register" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-auth { display: none !important; }
        }
      `}</style>
    </header>
  );
}
