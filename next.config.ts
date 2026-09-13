import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  outputFileTracingIncludes: {
    // The list, SQL export and sitemap read the server-side dataset.
    '/*': ['./data/exercises.json'],
    '/api/exports/sql': ['./data/exercises.json'],
    '/sitemap.xml': ['./data/exercises.json'],
  },
  async headers() {
    return process.env.VERCEL_ENV === 'preview'
      ? [{source: '/:path*', headers: [{key: 'X-Robots-Tag', value: 'noindex, nofollow'}]}]
      : [];
  },
};
export default createNextIntlPlugin('./src/i18n/request.ts')(config);
