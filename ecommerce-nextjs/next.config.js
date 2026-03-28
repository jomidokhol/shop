/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.imgur.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
    ],
    unoptimized: true,
  },
  // Allow any image domain (common for e-commerce with dynamic product images)
};

module.exports = nextConfig;
