/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { 
    unoptimized: true,
  },
  // Railway compatibility
  swcMinify: true,
};

module.exports = nextConfig;
