import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
export default async function NotFound() {
  const t = await getTranslations("UI");
  const locale = await getLocale();
  return (
    <section className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-6 text-2xl font-semibold">{t("notFound")}</h1>
      <p className="my-4 text-muted-foreground">{t("notFoundHint")}</p>
      <Link className="font-medium text-primary underline" href={`/${locale}/exercises`}>
        {t("back")}
      </Link>
    </section>
  );
}
