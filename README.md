# 🛍️ E-Commerce Next.js App

A full-featured e-commerce web application built with **Next.js 14** and **Firebase**, converted from a single-file HTML app. Fully ready to deploy on **Vercel** and host on **GitHub**.

---

## ✨ Features

- 🏠 **Home page** — Hero slider, categories, product grid, offer countdown timer
- 🔍 **Search** — Live suggestions, search history, keyword/tag matching
- 📦 **Product pages** — Gallery, variants (color/size), reviews, add to cart, buy now
- 🛒 **Cart drawer** — Persistent, multi-select, quantity control
- 📋 **Order Summary** — Address management, coupon codes, price breakdown
- 💳 **Checkout** — COD + custom payment gateways, transaction ID entry
- ✅ **Order Confirmation** — Barcode generation, downloadable JPG receipt
- 👤 **Profile** — Orders history, addresses, profile info editor
- 🔐 **Auth** — Email/password + Google Sign-In via Firebase Auth

---

## 🚀 Quick Setup

### 1. Clone / Download

```bash
git clone https://github.com/YOUR_USERNAME/ecommerce-nextjs.git
cd ecommerce-nextjs
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing one)
3. Enable **Authentication** → Email/Password + Google
4. Create **Firestore Database** (Start in test mode for development)
5. Go to **Project Settings → General → Your apps → Web app**
6. Copy your Firebase config

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔥 Firestore Collections

Your Firebase Firestore needs these collections (same structure as the original app):

### `settings/general` (document)
```json
{
  "siteName": "My Shop",
  "logoUrl": "https://...",
  "heroTitle": "Welcome",
  "heroDesc": "Shop amazing products",
  "heroSlides": [{"type": "image", "url": "https://..."}],
  "deliveryInside": 60,
  "deliveryOutside": 120,
  "codHandlingFee": 0,
  "paymentGateways": [{"name": "bKash", "number": "01XXXXXXXXX", "logoUrl": ""}],
  "footerAbout": "About text",
  "footerAddress": "Dhaka, Bangladesh",
  "footerPhone": "01XXXXXXXXX",
  "footerEmail": "shop@example.com",
  "footerCopyright": "© 2025 My Shop",
  "domainName": "https://myshop.com"
}
```

### `products` (collection)
```json
{
  "name": "Product Name",
  "price": 500,
  "originalPrice": 800,
  "images": ["https://..."],
  "description": "Product description",
  "category": "Electronics",
  "categorySlug": "electronics",
  "status": "Active",
  "sold": 150,
  "variants": [
    {
      "color": "Red",
      "imageUrl": "https://...",
      "price": 500,
      "sizes": [{"size": "S", "price": 500}, {"size": "M", "price": 550}]
    }
  ]
}
```

### `categories` (collection)
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "iconClass": "fas fa-laptop",
  "mediaType": "icon"
}
```

### `orders` (collection)
Auto-created when customers place orders.

### `users` (collection)
Auto-created on registration.

### `reviews` (collection)
```json
{
  "productId": "product_doc_id",
  "userId": "user_uid",
  "userName": "John",
  "rating": 5,
  "comment": "Great product!",
  "createdAt": "timestamp"
}
```

---

## 🌐 Deploy to Vercel

### Option A: GitHub + Vercel (Recommended)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ecommerce-nextjs.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Add Environment Variables (all `NEXT_PUBLIC_FIREBASE_*` keys)
5. Click **Deploy** 🎉

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
```

---

## 📁 Project Structure

```
ecommerce-nextjs/
├── app/
│   ├── layout.js              # Root layout with providers
│   ├── page.js                # Home page
│   ├── globals.css            # All global styles
│   ├── login/page.js          # Login page
│   ├── register/page.js       # Register page
│   ├── search/page.js         # Search page
│   ├── product/[id]/page.js   # Product detail page
│   ├── order-summary/page.js  # Cart review + address
│   ├── checkout/page.js       # Payment page
│   ├── order-confirmation/page.js  # Success page
│   └── profile/page.js        # User profile + orders
├── components/
│   ├── Header.jsx             # Sticky header with cart icon
│   ├── Footer.jsx             # Footer with links + socials
│   ├── CartDrawer.jsx         # Slide-in cart sidebar
│   ├── ProductCard.jsx        # Product grid card
│   ├── HeroSlider.jsx         # Homepage hero with auto-slide
│   ├── VariantPanel.jsx       # Bottom sheet for variant selection
│   └── Notification.jsx       # Toast notification system
├── context/
│   ├── AuthContext.js         # Firebase auth state
│   ├── CartContext.js         # Cart state (localStorage)
│   └── ShopContext.js         # Shop settings from Firestore
├── lib/
│   └── firebase.js            # Firebase init
├── .env.example               # Environment variables template
├── next.config.js
└── package.json
```

---

## 🎨 Theming

Edit CSS variables in `app/globals.css`:

```css
:root {
  --primary: #166534;    /* Main green */
  --secondary: #f97316;  /* Orange accent */
  --dark: #1f2937;
  --gray: #6b7280;
  --light: #f9fafb;
}
```

---

## 📝 Notes

- **Cart** is persisted in `localStorage` (no login required to add items)
- **Addresses** are stored in `localStorage` keyed by user UID
- **Coupon code** `DISCOUNT10` gives 10% off (demo only — connect to Firestore `coupons` collection for production)
- The app uses **Firebase Firestore** for all product/order data, same structure as your original HTML app
- **Google Sign-In** requires adding your domain to Firebase Auth → Authorized domains
