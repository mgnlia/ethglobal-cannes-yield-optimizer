/** @type {import('next').NextConfig} */
const nextConfig = {
  // API_URL defaults to same-origin (Next.js API routes) — no Railway needed
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
}

module.exports = nextConfig
