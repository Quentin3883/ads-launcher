const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@launcher-ads/sdk', '@launcher-ads/ui'],
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
}

module.exports = nextConfig
