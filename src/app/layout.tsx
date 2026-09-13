import type {Metadata} from 'next';
import {getLocale, getMessages} from 'next-intl/server';
import {NextIntlClientProvider} from 'next-intl';
import {ThemeProvider} from '@/components/theme-provider';
import '@fontsource-variable/dm-sans';
import './css/globals.css';

export const metadata: Metadata = {title: {default: 'Exercise Library', template: '%s · Exercise Library'}};
export default async function RootLayout({children}: {children: React.ReactNode}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return <html className="scroll-smooth rounded-none" lang={locale} suppressHydrationWarning>
    <body className="rounded-none min-h-screen text-sm font-sans antialiased">
      <NextIntlClientProvider locale={locale} messages={{UI: messages.UI}}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </NextIntlClientProvider>
    </body>
  </html>;
}
