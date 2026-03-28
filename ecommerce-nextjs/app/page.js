'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Notification from '@/components/Notification';
import HeroSlider from '@/components/HeroSlider';
import ProductCard, { ProductCardSkeleton } from '@/components/ProductCard';
import { useShop } from '@/context/ShopContext';

export default function HomePage() {
  const { products, categories, loadingProducts, loadingSettings } = useShop();
  const [filter, setFilter] = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [timerState, setTimerState] = useState({ d: '00', h: '00', m: '00', s: '00' });

  // Offer timer
  useEffect(() => {
    const end = new Date();
    end.setDate(end.getDate() + 3);
    const tick = () => {
      const dist = end - Date.now();
      if (dist < 0) return;
      const pad = n => String(Math.floor(n)).padStart(2, '0');
      setTimerState({
        d: pad(dist / 86400000),
        h: pad((dist % 86400000) / 3600000),
        m: pad((dist % 3600000) / 60000),
        s: pad((dist % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Filter + sort products
  const displayProducts = (() => {
    let list = [...products];
    if (selectedCategory) list = list.filter(p => p.category === selectedCategory || p.categorySlug === selectedCategory);
    switch (filter) {
      case 'price-asc': list.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price-desc': list.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'top-selling': list.sort((a, b) => (b.sold || 0) - (a.sold || 0)); break;
      case 'most-discount': list.sort((a, b) => {
        const da = a.originalPrice > a.price ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
        const db2 = b.originalPrice > b.price ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
        return db2 - da;
      }); break;
      default: break;
    }
    return list;
  })();

  const filterLabels = {
    'default': 'Default',
    'price-asc': 'Price: Low → High',
    'price-desc': 'Price: High → Low',
    'top-selling': 'Top Selling',
    'most-discount': 'Most Discount',
  };

  return (
    <>
      <Header />
      <CartDrawer />
      <Notification />

      <main>
        {/* Hero */}
        <HeroSlider />

        {/* Categories */}
        <section id="categories" style={{ padding: '10px 0 20px' }}>
          <div className="container">
            <div style={{ display: 'flex', gap: 15, overflowX: 'auto', padding: '10px 0', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
              {/* All Categories chip */}
              <div
                className="category-card"
                onClick={() => setSelectedCategory(null)}
                style={{ border: selectedCategory === null ? '2px solid var(--primary)' : undefined }}
              >
                <div className="category-icon"><i className="fas fa-th" /></div>
                <h3>All</h3>
              </div>

              {loadingSettings
                ? Array(5).fill(0).map((_, i) => (
                  <div key={i} className="category-card skeleton" style={{ border: 'none', background: '#f3f4f6' }} />
                ))
                : categories.map(cat => (
                  <div
                    key={cat.id}
                    className="category-card"
                    onClick={() => setSelectedCategory(selectedCategory === (cat.slug || cat.id) ? null : (cat.slug || cat.id))}
                    style={{ border: selectedCategory === (cat.slug || cat.id) ? '2px solid var(--primary)' : undefined }}
                  >
                    {cat.mediaType === 'image' && cat.imageUrl
                      ? <img src={cat.imageUrl} alt={cat.name} />
                      : <div className="category-icon"><i className={cat.iconClass || 'fas fa-box'} /></div>
                    }
                    <h3>{cat.name}</h3>
                  </div>
                ))
              }
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="shop" style={{ padding: '20px 0 60px', background: '#f3f4f6' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                {selectedCategory ? categories.find(c => (c.slug || c.id) === selectedCategory)?.name || 'Products' : 'Featured Products'}
                <span style={{ fontSize: '0.9rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 8 }}>
                  ({displayProducts.length})
                </span>
              </h2>
            </div>

            {/* Filter Bar */}
            <div className="filter-controls" style={{ justifyContent: 'flex-end', paddingTop: 10 }}>
              <div className="filter-dropdown-container">
                <button
                  className="filter-toggle-btn"
                  onClick={() => setFilterOpen(o => !o)}
                >
                  <i className="fas fa-filter" /> {filterLabels[filter]}
                </button>
                <div className={`filter-options-dropdown${filterOpen ? ' active' : ''}`}>
                  {Object.entries(filterLabels).map(([key, label]) => (
                    <button
                      key={key}
                      className={filter === key ? 'active' : ''}
                      onClick={() => { setFilter(key); setFilterOpen(false); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="product-grid">
              {loadingProducts
                ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
                : displayProducts.length === 0
                  ? (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                      <i className="fas fa-box-open" />
                      <h3>No products found</h3>
                      <p>Try a different category or filter</p>
                    </div>
                  )
                  : displayProducts.map(p => <ProductCard key={p.id} product={p} />)
              }
            </div>
          </div>
        </section>

        {/* Offer Timer Banner */}
        {!loadingProducts && displayProducts.length > 0 && (
          <section style={{ background: 'linear-gradient(135deg, #166534, #14532d)', color: 'white', padding: '30px 0' }}>
            <div className="container" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                <i className="fas fa-fire" style={{ color: 'var(--secondary)', fontSize: '1.4rem' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Flash Sale Ends In</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {[
                  { val: timerState.d, label: 'Days' },
                  { val: timerState.h, label: 'Hours' },
                  { val: timerState.m, label: 'Min' },
                  { val: timerState.s, label: 'Sec' },
                ].map(({ val, label }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 16px', fontSize: '1.8rem', fontWeight: 800, minWidth: 60 }}>
                      {val}
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.8 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Close filter dropdown on outside click */}
      {filterOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 94 }}
          onClick={() => setFilterOpen(false)}
        />
      )}
    </>
  );
}
