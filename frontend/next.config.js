/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add path aliases for better module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
