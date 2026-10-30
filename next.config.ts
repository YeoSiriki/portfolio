import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Les scripts et styles « inline » de Next.js imposent 'unsafe-inline' : une CSP à nonce
// rendrait toutes les pages dynamiques, ce qui contredit la génération statique demandée.
// experimental.sri (essayé le 2026-10-30) ne couvre que les scripts externes : les scripts inline
// qui portent le contenu de chaque page étaient bloqués et le site ne fonctionnait plus.
// script-src-attr 'none' interdit au moins les gestionnaires en attribut (onerror="...", onclick="..."),
// forme la plus courante d'injection de script ; React et Next.js n'en utilisent aucun.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  ...(isDev ? [] : ["script-src-attr 'none'"]),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://github.com",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Une page d'un autre site ouverte depuis celui-ci (ou l'inverse) ne peut pas manipuler sa fenêtre.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/fichiers/**' }],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
