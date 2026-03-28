'use client';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';

export default function Footer() {
  const { settings, socials } = useShop();

  return (
    <footer style={{ background: 'var(--dark)', color: '#9ca3af', padding: '40px 0 20px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 30, marginBottom: 30 }}>
          {/* Brand */}
          <div>
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: 40, marginBottom: 15, filter: 'brightness(10)' }} />
            )}
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{settings.footerAbout}</p>

            {/* Socials */}
            {socials.length > 0 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 15 }}>
                {socials.map(s => {
                  let url = s.url || '#';
                  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
                  return (
                    <a
                      key={s.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', textDecoration: 'none', transition: 'background 0.3s',
                      }}
                    >
                      <i className={s.iconClass || 'fas fa-link'} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'white', marginBottom: 15, fontWeight: 600 }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: '/', label: 'Home' },
                { href: '/search', label: 'Search Products' },
                { href: '/cart', label: 'Shopping Cart' },
                { href: '/profile', label: 'My Account' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'white', marginBottom: 15, fontWeight: 600 }}>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
              {settings.footerAddress && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <i className="fas fa-map-marker-alt" style={{ marginTop: 3, flexShrink: 0, color: 'var(--secondary)' }} />
                  <span>{settings.footerAddress}</span>
                </div>
              )}
              {settings.footerPhone && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <i className="fas fa-phone" style={{ flexShrink: 0, color: 'var(--secondary)' }} />
                  <a href={`tel:${settings.footerPhone}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                    {settings.footerPhone}
                  </a>
                </div>
              )}
              {settings.footerEmail && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <i className="fas fa-envelope" style={{ flexShrink: 0, color: 'var(--secondary)' }} />
                  <a href={`mailto:${settings.footerEmail}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                    {settings.footerEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, textAlign: 'center', fontSize: '0.85rem' }}
          dangerouslySetInnerHTML={{ __html: settings.footerCopyright || `© ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.` }}
        />
      </div>
    </footer>
  );
}
