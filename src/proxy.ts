import {NextResponse, type NextRequest} from 'next/server';
import {isLocale, defaultLocale} from './i18n/config';

export function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.split('/')[1];
  const headers = new Headers(request.headers);
  // Always overwrite external values; locale comes only from the URL.
  headers.set('x-app-locale', isLocale(segment) ? segment : defaultLocale);
  return NextResponse.next({request: {headers}});
}
export const config = {matcher: ['/((?!api|_next|images|videos|data|.*\\..*).*)']};
