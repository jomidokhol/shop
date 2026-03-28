'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [settings, setSettings] = useState({
    siteName: 'Online Shop',
    logoUrl: '',
    heroTitle: 'Welcome to Our Store',
    heroDesc: 'Discover amazing products at great prices.',
    deliveryInside: 60,
    deliveryOutside: 120,
    codHandlingFee: 0,
    footerAbout: '',
    footerAddress: '',
    footerPhone: '',
    footerEmail: '',
    footerCopyright: '',
    domainName: '',
    heroSlides: [],
    paymentGateways: [],
  });
  const [categories, setCategories] = useState([]);
  const [socials, setSocials] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Settings
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists()) {
          const d = settingsSnap.data();
          setSettings(prev => ({
            ...prev,
            siteName: d.siteName || prev.siteName,
            logoUrl: d.logoUrl || '',
            heroTitle: d.heroTitle || prev.heroTitle,
            heroDesc: d.heroDesc || prev.heroDesc,
            deliveryInside: parseFloat(d.deliveryInside) || 60,
            deliveryOutside: parseFloat(d.deliveryOutside) || 120,
            codHandlingFee: parseFloat(d.codHandlingFee) || 0,
            footerAbout: d.footerAbout || '',
            footerAddress: d.footerAddress || '',
            footerPhone: d.footerPhone || '',
            footerEmail: d.footerEmail || '',
            footerCopyright: d.footerCopyright || '',
            domainName: d.domainName || '',
            heroSlides: d.heroSlides || [],
            paymentGateways: d.paymentGateways || [],
          }));
        }

        // Categories
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats = [];
        catSnap.forEach(d => cats.push({ id: d.id, ...d.data() }));
        setCategories(cats);

        // Socials
        const socialSnap = await getDocs(collection(db, 'socials'));
        const socs = [];
        socialSnap.forEach(d => socs.push({ id: d.id, ...d.data() }));
        setSocials(socs);

      } catch (e) {
        console.error('Failed to load shop settings:', e);
      } finally {
        setLoadingSettings(false);
      }

      // Products
      try {
        const prodSnap = await getDocs(collection(db, 'products'));
        const prods = [];
        prodSnap.forEach(d => {
          const data = d.data();
          if (data.status !== 'Inactive') {
            prods.push({ id: d.id, ...data });
          }
        });
        setProducts(prods);
      } catch (e) {
        console.error('Failed to load products:', e);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadData();
  }, []);

  return (
    <ShopContext.Provider value={{
      settings, categories, socials, products,
      loadingSettings, loadingProducts
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
