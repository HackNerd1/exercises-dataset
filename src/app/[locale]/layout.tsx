import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { LocaleDocument } from "@/components/layout/locale-document";
import { isLocale } from "@/i18n/config";
import { Preferences } from "@/components/layout/preferences";
import { Dumbbell } from "lucide-react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations("UI");
  const messages = await getMessages({ locale });
  return (
    <NextIntlClientProvider locale={locale} messages={{ UI: messages.UI }}>
      <LocaleDocument locale={locale} />
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary p-3 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t("skip")}
      </a>
      <header className="fixed top-0 z-[2] w-full bg-white shadow-md dark:bg-dark">
        <div className="mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-2 px-3 sm:h-18 sm:gap-3 sm:px-6 sm:py-4">
          <Link href={`/${locale}/exercises`} className="flex min-w-0 items-center gap-2 rounded-lg sm:gap-3">
            <Dumbbell aria-hidden="true" className="size-6 shrink-0 text-primary sm:size-7" />
            <span className="truncate text-base font-semibold tracking-tight sm:text-lg">{t("brand")}</span>
          </Link>
          <Preferences />
        </div>
      </header>
      <main
        id="main"
        className="scroll-smooth scroll-mt-14 mx-auto mt-14 min-h-[75vh] max-w-[1480px] px-4 py-6 sm:scroll-mt-18 sm:mt-18 sm:px-8 sm:py-8 lg:px-10"
      >
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1480px] flex-wrap justify-between gap-3 px-6 py-7 text-xs text-muted-foreground">
          <span>{t("builtWith")}</span>
          <a href="/NOTICE.md" className="underline underline-offset-4">
            {t("attribution")}
          </a>
        </div>
      </footer>
    </NextIntlClientProvider>
  );
}
