/** @type {import('next').NextConfig} */
const nextConfig = {
  // Schwere Server-Bibliotheken (Datei→Markdown-Konvertierung) NICHT in den
  // Route-Bundle ziehen, sondern zur Laufzeit aus node_modules laden. Ohne das
  // schlägt das Bündeln in manchen Build-Umgebungen (z.B. Nixpacks auf Coolify)
  // fehl, obwohl `next build` durchläuft — Symptom: „Konvertierung
  // fehlgeschlagen" erst zur Request-Zeit in Production.
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
