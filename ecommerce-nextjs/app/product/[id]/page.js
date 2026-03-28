'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Notification, { showNotification } from '@/components/Notification';
import ProductCard from '@/components/ProductCard';
import VariantPanel from '@/components/VariantPanel';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';

function StarRating({ rating, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <i key={s} className={`fas fa-star`} style={{ color: s <= Math.round(rating) ? '#f59e0b' : '#d1d5db', fontSize: '0.95rem' }} />
      ))}
      <span style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>
        {rating?.toFixed(1) || '0.0'} ({count || 0} reviews)
      </span>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const { settings, products } = useShop();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoomed, setLightboxZoomed] = useState(false);
  const [variantPanel, setVariantPanel] = useState(null); // 'cart' | 'buy' | null
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [deliveryRegion, setDeliveryRegion] = useState('Inside Dhaka');
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setProduct(data);
          const img = (data.images && data.images[0]) || data.image || '';
          setMainImage(img);
          document.title = data.name;

          // Reviews
          try {
            const rSnap = await getDocs(query(collection(db, 'reviews'), where('productId', '==', id), orderBy('createdAt', 'desc')));
            const revs = [];
            rSnap.forEach(d => revs.push({ id: d.id, ...d.data() }));
            setReviews(revs);
          } catch (e) { /* reviews optional */ }

        } else {
          router.push('/');
        }
      } catch (e) {
        console.error(e);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  // Related products
  useEffect(() => {
    if (product && products.length > 0) {
      const related = products
        .filter(p => p.id !== product.id && (p.category === product.category || p.categorySlug === product.categorySlug))
        .slice(0, 8);
      setSuggestedProducts(related.length > 0 ? related : products.filter(p => p.id !== product.id).slice(0, 8));
    }
  }, [product, products]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="container" style={{ paddingTop: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
            <div>
              <div className="skeleton" style={{ height: 36, width: '80%', borderRadius: 8, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 24, width: '50%', borderRadius: 8, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 48, width: '60%', borderRadius: 8, marginBottom: 24 }} />
              <div className="skeleton" style={{ height: 80, borderRadius: 8, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 50, borderRadius: 8 }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) return null;

  const images = product.images || (product.image ? [product.image] : []);
  const price = product.price || 0;
  const originalPrice = product.originalPrice || price;
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const deliveryCharge = deliveryRegion === 'Outside Dhaka' ? settings.deliveryOutside : settings.deliveryInside;
  const hasVariants = product.variants && product.variants.length > 0;
  const isOutOfStock = product.status === 'Out of Stock';

  const handleAddToCart = () => {
    if (hasVariants) { setVariantPanel('cart'); return; }
    addToCart(product, quantity);
    showNotification(`${product.name} added to cart!`);
    setIsCartOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification('Link copied to clipboard!');
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  return (
    <>
      <Header />
      <CartDrawer />
      <Notification />

      {variantPanel && (
        <VariantPanel
          product={product}
          mode={variantPanel}
          onClose={() => {
            setVariantPanel(null);
            if (variantPanel === 'cart') setIsCartOpen(true);
          }}
        />
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
          <img
            src={mainImage}
            alt={product.name}
            className={lightboxZoomed ? 'zoomed' : ''}
            onClick={e => { e.stopPropagation(); setLightboxZoomed(z => !z); }}
          />
        </div>
      )}

      <main style={{ background: 'white', minHeight: '80vh', paddingBottom: 120 }}>
        <div className="container" style={{ paddingTop: 30 }}>
          {/* Back */}
          <button
            onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}
          >
            <i className="fas fa-arrow-left" /> Back
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
            {/* Gallery */}
            <div>
              <div
                style={{ width: '100%', height: 400, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', cursor: 'zoom-in', marginBottom: 15 }}
                onClick={() => setLightboxOpen(true)}
              >
                <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      onClick={() => setMainImage(img)}
                      style={{
                        width: 80, height: 80, objectFit: 'cover', borderRadius: 6,
                        cursor: 'pointer', border: `2px solid ${mainImage === img ? 'var(--primary)' : 'transparent'}`,
                        opacity: mainImage === img ? 1 : 0.6,
                        transition: 'all 0.2s', flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', lineHeight: 1.2, flex: 1 }}>{product.name}</h1>
                <button
                  onClick={handleShare}
                  style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', flexShrink: 0, marginLeft: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)' }}
                >
                  <i className="fas fa-share-alt" />
                </button>
              </div>

              <StarRating rating={avgRating} count={reviews.length} />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>৳{price.toFixed(0)}</span>
                {originalPrice > price && (
                  <span style={{ fontSize: '1.1rem', color: '#6c819e', textDecoration: 'line-through' }}>৳{originalPrice.toFixed(0)}</span>
                )}
                {discount > 0 && (
                  <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '2px 10px', fontSize: '0.85rem', fontWeight: 700 }}>
                    {discount}% OFF
                  </span>
                )}
              </div>

              {product.sold > 0 && (
                <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: 12, fontWeight: 500 }}>
                  <i className="fas fa-fire" style={{ color: 'var(--secondary)', marginRight: 4 }} />
                  {product.sold} sold
                </div>
              )}

              {/* Delivery Info */}
              <div className="delivery-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>
                    <i className="fas fa-truck" style={{ marginRight: 6 }} />
                    <strong>Delivery to {deliveryRegion}:</strong>{' '}
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>৳{deliveryCharge}</span>
                  </span>
                  <select
                    value={deliveryRegion}
                    onChange={e => setDeliveryRegion(e.target.value)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <option>Inside Dhaka</option>
                    <option>Outside Dhaka</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 8, fontSize: '1rem' }}>Description</h3>
                  <div style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {product.description}
                  </div>
                </div>
              )}

              {/* Quantity (no variants) */}
              {!hasVariants && !isOutOfStock && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingTop: 15, borderTop: '1px solid #eee' }}>
                  <span style={{ fontWeight: 600 }}>Quantity:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                    <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
                    <button className="qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {isOutOfStock ? (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 20px', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>
                  Out of Stock
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '12px' }}
                    onClick={handleAddToCart}
                  >
                    <i className="fas fa-shopping-cart" /> Add to Cart
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px' }}
                    onClick={() => hasVariants ? setVariantPanel('buy') : router.push('/order-summary')}
                  >
                    Buy Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ marginTop: 50, padding: '30px 0', borderTop: '1px solid #eee' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: 20 }}>
                <i className="fas fa-star" style={{ color: '#f59e0b', marginRight: 8 }} />
                Customer Reviews ({reviews.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {reviews.slice(0, 5).map(r => (
                  <div key={r.id} style={{ background: '#f9fafb', borderRadius: 10, padding: 15, border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>{r.userName || 'Customer'}</div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <i key={s} className="fas fa-star" style={{ fontSize: '0.8rem', color: s <= r.rating ? '#f59e0b' : '#d1d5db' }} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>{r.comment}</p>}
                    {r.images && r.images.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        {r.images.map((img, i) => (
                          <img key={i} src={img} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Products */}
          {suggestedProducts.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
                You Might Also Like
              </h2>
              <div className="product-grid">
                {suggestedProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Sticky Bottom Bar */}
      {!isOutOfStock && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #eee', padding: '12px 20px', display: 'flex', gap: 12, zIndex: 90, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1, padding: '12px' }}
            onClick={handleAddToCart}
          >
            <i className="fas fa-shopping-cart" /> Add to Cart
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px' }}
            onClick={() => {
              if (!hasVariants) { addToCart(product, quantity); }
              router.push('/order-summary');
            }}
          >
            Buy Now
          </button>
        </div>
      )}
    </>
  );
}
