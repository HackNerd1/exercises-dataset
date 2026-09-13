"use client";
import { useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { locales, languageNames, type Locale } from "@/i18n/config";

const languageFlags: Record<Locale, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
  it: "🇮🇹",
  tr: "🇹🇷",
  ru: "🇷🇺",
  zh: "🇨🇳",
  hi: "🇮🇳",
  pl: "🇵🇱",
  ko: "🇰🇷",
  fr: "🇫🇷",
};
const themeIcons = { light: Sun, dark: Moon, system: Monitor };
const triggerClass = cn(
  buttonVariants({ variant: "lightprimary", size: "icon", shape: "pill" }),
  "shrink-0 justify-center rounded-full border-0 p-0 shadow-none dark:bg-lightprimary dark:hover:bg-primary data-[size=default]:h-10 [&_svg:not([class*=text-])]:text-current",
);

const subscribe = () => () => {};

export function Preferences() {
  const t = useTranslations("UI");
  const locale = useLocale();
  const path = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // The server snapshot keeps theme-dependent controls stable during hydration.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const currentTheme = mounted && theme && theme in themeIcons ? (theme as keyof typeof themeIcons) : "system";
  const ThemeIcon = themeIcons[currentTheme];
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Select
        value={locale}
        onValueChange={(next) => {
          const segments = path.split("/");
          segments[1] = next;
          router.push(segments.join("/") + (search.size ? `?${search.toString()}` : ""));
        }}
      >
        <SelectTrigger
          aria-label={t("language")}
          title={`${t("language")}: ${languageNames[locale as Locale]}`}
          showChevron={false}
          className={triggerClass}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            {languageFlags[locale as Locale]}
          </span>
        </SelectTrigger>
        <SelectContent align="end">
          {locales.map((code) => (
            <SelectItem key={code} value={code} textValue={languageNames[code]}>
              <span aria-hidden="true" className="text-xl">
                {languageFlags[code]}
              </span>
              {languageNames[code]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={mounted ? theme : "system"} onValueChange={setTheme} disabled={!mounted}>
        <SelectTrigger
          aria-label={t("theme")}
          title={`${t("theme")}: ${t(currentTheme)}`}
          showChevron={false}
          className={triggerClass}
        >
          <ThemeIcon aria-hidden="true" className="size-5" />
        </SelectTrigger>
        <SelectContent align="end">
          {(["light", "dark", "system"] as const).map((value) => {
            const Icon = themeIcons[value];
            return (
              <SelectItem key={value} value={value}>
                <Icon aria-hidden="true" className="size-4" />
                {t(value)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
