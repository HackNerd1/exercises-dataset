import type {MetadataRoute} from 'next';
import {locales} from '@/i18n/config';
import {siteUrl} from '@/lib/seo';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.VERCEL_ENV === 'preview') return [];
  const root = siteUrl();
  const paths = ['/exercises'];
  return paths.flatMap(path => locales.map(locale => ({url:`${root}/${locale}${path}`, alternates:{languages:Object.fromEntries(locales.map(code => [code,`${root}/${code}${path}`]))}})));
}
