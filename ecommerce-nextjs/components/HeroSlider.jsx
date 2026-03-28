'use client';
import { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';

export default function HeroSlider() {
  const { settings } = useShop();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = settings.heroSlides && settings.heroSlides.length > 0
    ? settings.heroSlides
    : [{ type: 'color', color: '#166534' }];

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section style={{
      position: 'relative',
      color: 'white',
      width: '100%',
      aspectRatio: '2.5 / 1',
      maxHeight: '80vh',
      marginBottom: 20,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      marginTop: -70,
      paddingTop: 70,
    }}>
      {/* Background Slides */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        {slides.map((slide, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              opacity: i === currentSlide ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          >
            {slide.type === 'image' && slide.url ? (
              <img src={slide.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : slide.type === 'video' && slide.url ? (
              <video src={slide.url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: slide.color || 'linear-gradient(135deg, #166534, #14532d)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Dark Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1 }} />

      {/* Hero Content */}
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 600, padding: 20 }}>
          <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', marginBottom: 20, lineHeight: 1.2 }}>
            {settings.heroTitle || 'Welcome to Our Store'}
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', marginBottom: 30, opacity: 0.9, whiteSpace: 'pre-wrap' }}>
            {settings.heroDesc || 'Discover amazing products at great prices.'}
          </p>
          <a href="#shop" className="btn btn-secondary" style={{ padding: '12px 30px', fontSize: '1rem' }}>
            Shop Now
          </a>
        </div>
      </div>

      {/* Slide Dots */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 2 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              style={{
                width: i === currentSlide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.5)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
