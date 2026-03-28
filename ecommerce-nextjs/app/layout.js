// app/layout.js
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ShopProvider } from '@/context/ShopContext';
import Script from 'next/script';

export const metadata = {
  title: 'Online Shop',
  description: 'Welcome to our online store. Discover amazing products!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,1,0"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <ShopProvider>
              {children}
            </ShopProvider>
          </CartProvider>
        </AuthProvider>
        <Script
          src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
