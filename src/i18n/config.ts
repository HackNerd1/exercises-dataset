export const locales = ['en', 'es', 'it', 'tr', 'ru', 'zh', 'hi', 'pl', 'ko', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
export const languageNames: Record<Locale, string> = {
  en: 'English', es: 'Español', it: 'Italiano', tr: 'Türkçe', ru: 'Русский',
  zh: '简体中文', hi: 'हिन्दी', pl: 'Polski', ko: '한국어', fr: 'Français',
};
