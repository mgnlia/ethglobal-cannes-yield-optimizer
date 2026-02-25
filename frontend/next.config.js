/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ethglobal-cannes-yield-optimizer-api.up.railway.app',
  },
  output: 'standalone',
}

module.exports = nextConfig
