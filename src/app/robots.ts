import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'preview') return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: `${siteUrl()}/sitemap.xml` };
}
