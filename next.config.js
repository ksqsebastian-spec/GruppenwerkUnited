/** @type {import('next').NextConfig} */
const nextConfig = {
  // Schwere Server-Bibliotheken (Datei→Markdown-Konvertierung) aus dem
  // Route-Bundle heraushalten. Verhindert Bündelungsprobleme in verschiedenen
  // Build-Umgebungen; der Cloudflare-/OpenNext-Build (workerd) bündelt sie
  // beim Deploy dennoch korrekt in den Worker.
  serverExternalPackages: ['unpdf', 'mammoth', 'xlsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
