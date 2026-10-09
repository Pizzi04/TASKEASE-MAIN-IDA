import type { NextConfig } from 'next'

// Foto dall'archivio Supabase: solo questo indirizzo, solo il bucket pubblico "foto"
const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: supabase.hostname, pathname: '/storage/v1/object/public/foto/**' }],
  },
  experimental: {
    // Foto fino a 3 MB nelle azioni server (profilo e bacheca)
    serverActions: { bodySizeLimit: '4mb' },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ]
  },
}

export default nextConfig
