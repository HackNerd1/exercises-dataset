import type {Metadata} from 'next';
import {locales, type Locale} from '@/i18n/config';
export function siteUrl() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
  return new URL(candidate).origin;
}
export function pageMetadata(locale: Locale, path: string, title: string, description: string, noindex = false): Metadata {
  const root = siteUrl();
  return {
    title, description,
    alternates: {canonical: `${root}/${locale}${path}`, languages: Object.fromEntries([...locales.map(code => [code, `${root}/${code}${path}`]), ['x-default', `${root}/en${path}`]])},
    robots: {index: !noindex && process.env.VERCEL_ENV !== 'preview', follow: true},
    openGraph: {title, description, url: `${root}/${locale}${path}`, type: 'website', locale},
  };
}
