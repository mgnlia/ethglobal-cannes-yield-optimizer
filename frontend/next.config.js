/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty string = same-origin Next.js API routes (/api/yields, /api/recommend, etc.)
  // Set NEXT_PUBLIC_API_URL env var to point to an external backend if needed
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
}

module.exports = nextConfig
