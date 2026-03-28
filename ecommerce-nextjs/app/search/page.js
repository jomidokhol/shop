'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Notification from '@/components/Notification';
import ProductCard from '@/components/ProductCard';
import { useShop } from '@/context/ShopContext';

const HISTORY_KEY = 'search_history';

export default function SearchPage() {
  const router = useRouter();
  const { products } = useShop();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      setSearchHistory(h);
    } catch (e) {}
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const saveHistory = (term) => {
    try {
      const current = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const updated = [term, ...current.filter(h => h !== term)].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (e) {}
  };

  const handleSearch = (term) => {
    const t = (term || query).trim();
    if (!t) return;
    saveHistory(t);
    setQuery(t);
    setSuggestions([]);
    setSearched(true);

    const lower = t.toLowerCase();
    const found = products.filter(p => {
      if (p.name?.toLowerCase().includes(lower)) return true;
      if (p.description?.toLowerCase().includes(lower)) return true;
      if (p.category?.toLowerCase().includes(lower)) return true;
      if (typeof p.seo_tag === 'string' && p.seo_tag.toLowerCase().includes(lower)) return true;
      if (Array.isArray(p.keywords) && p.keywords.some(k => k.toLowerCase().includes(lower))) return true;
      return false;
    });
    setResults(found);
  };

  const handleInput = (val) => {
    setQuery(val);
    setSuggestions([]);
    setSearched(false);

    if (val.trim().length < 2) return;
    const lower = val.toLowerCase();
    const matched = new Set();
    products.forEach(p => {
      if (p.name?.toLowerCase().includes(lower)) matched.add(p.name);
      if (typeof p.seo_tag === 'string') {
        p.seo_tag.split(',').forEach(tag => {
          if (tag.trim().toLowerCase().includes(lower)) matched.add(tag.trim());
        });
      }
      if (Array.isArray(p.keywords)) {
        p.keywords.forEach(k => { if (k.toLowerCase().includes(lower)) matched.add(k); });
      }
    });
    setSuggestions([...matched].slice(0, 8));
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setSearchHistory([]);
  };

  return (
    <>
      <Header />
      <CartDrawer />
      <Notification />

      <main style={{ minHeight: '80vh', background: '#f9fafb', paddingBottom: 40 }}>
        {/* Search Bar */}
        <div style={{ background: 'white', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', position: 'sticky', top: 70, zIndex: 90 }}>
          <div className="container">
            <div style={{ position: 'relative' }}>
              <form onSubmit={e => { e.preventDefault(); handleSearch(); }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: 25, border: '2px solid transparent', transition: 'border-color 0.2s', padding: '0 15px', gap: 10 }}>
                  <i className="fas fa-search" style={{ color: 'var(--gray)' }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => handleInput(e.target.value)}
                    placeholder="Search for products, brands..."
                    style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 0', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', outline: 'none' }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(''); setSuggestions([]); setSearched(false); inputRef.current?.focus(); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', fontSize: '1rem' }}
                    >
                      <i className="fas fa-times" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ borderRadius: 20, padding: '8px 20px', whiteSpace: 'nowrap' }}
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'white', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  border: '1px solid #eee', zIndex: 100, overflow: 'hidden', marginTop: 4,
                }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => { setQuery(s); handleSearch(s); }}
                      style={{
                        padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        borderBottom: i < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <i className="fas fa-search" style={{ color: 'var(--gray)', fontSize: '0.85rem' }} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 25 }}>
          {/* Search History */}
          {!searched && searchHistory.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ fontWeight: 600, fontSize: '1.05rem' }}>Recent Searches</h3>
                <button onClick={clearHistory} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>
                  Clear All
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {searchHistory.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(h); handleSearch(h); }}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e7eb',
                      background: 'white', cursor: 'pointer', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Poppins, sans-serif',
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="fas fa-history" style={{ color: 'var(--gray)', fontSize: '0.8rem' }} />
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {searched && (
            <>
              <div style={{ marginBottom: 20, color: 'var(--gray)', fontSize: '0.9rem' }}>
                {results.length > 0
                  ? `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
                  : `No results for "${query}"`
                }
              </div>
              {results.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <i className="fas fa-search" />
                  <h3>No products found</h3>
                  <p>Try different keywords or browse categories</p>
                  <button className="btn btn-primary" style={{ marginTop: 15 }} onClick={() => router.push('/')}>
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="product-grid">
                  {results.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </>
          )}

          {/* Popular when no search */}
          {!searched && searchHistory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
              <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: 15, color: '#d1d5db' }} />
              <h3 style={{ marginBottom: 8, color: 'var(--dark)' }}>What are you looking for?</h3>
              <p>Search for products, brands, or categories</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
