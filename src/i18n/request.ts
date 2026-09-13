import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';
import {isLocale, defaultLocale} from './config';
export default getRequestConfig(async () => {
  const candidate = (await headers()).get('x-app-locale') ?? defaultLocale;
  const locale = isLocale(candidate) ? candidate : defaultLocale;
  return {locale, messages: (await import(`../../messages/${locale}.json`)).default};
});
