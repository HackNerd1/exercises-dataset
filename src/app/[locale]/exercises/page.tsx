import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, SearchX } from "lucide-react";
import { isLocale } from "@/i18n/config";
import { getTaxonomy } from "@/i18n/taxonomy";
import { getFacets, listExercises } from "@/lib/exercises/repository.server";
import { parseQuery, queryHref, serializeQuery, toSearchParams } from "@/lib/exercises/query";
import type { SearchParams } from "@/lib/exercises/types";
import { pageMetadata } from "@/lib/seo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseMedia } from "@/features/exercises/media";
import { localizeName } from "@/lib/exercises/localize";
import { DetailDialog } from "@/features/exercises/detail-dialog";
import { ExerciseDetail } from "@/features/exercises/detail";
import { Filters } from "@/features/exercises/filters";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> };
export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations("UI");
  const query = parseQuery(toSearchParams(await searchParams), await getFacets());
  const suffix = serializeQuery(query);
  return pageMetadata(
    locale,
    suffix ? `/exercises?${suffix}` : "/exercises",
    t("library"),
    t("subtitle"),
    Boolean(suffix),
  );
}
export default async function ExercisesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations("UI");
  const facets = await getFacets();
  const labels = getTaxonomy(locale);
  const raw = toSearchParams(await searchParams);
  const { items, total, pages, query } = await listExercises(parseQuery(raw, facets), labels);
  const path = `/${locale}/exercises`;
  if (raw.toString() !== serializeQuery(query)) redirect(queryHref(path, query));
  return (
    <>
      <div className="space-y-8">
        <Filters query={query} facets={facets} labels={labels} destination={path} embedded />
        <section aria-label={t("library")} className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground" role="status">
                {t("results", { count: total })}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{t("page", { current: query.page, total: pages })}</span>
          </div>
          {items.length ? (
            <div className="grid grid-cols-1 gap-5 min-[540px]:grid-cols-2 xl:grid-cols-3" data-testid="exercise-grid">
              {items.map((ex) => {
                const localized = localizeName(ex, locale);
                return (
                  <Card
                    key={ex.id}
                    data-testid="exercise-card"
                    className="group relative isolate gap-0 overflow-hidden"
                  >
                    <Link
                      href={`${path}/${ex.id}`}
                      aria-label={localized.name}
                      className="absolute inset-0 z-10 rounded-xl md:hidden"
                    />
                    <DetailDialog name={localized.name}>
                      <ExerciseDetail exercise={ex} locale={locale} />
                    </DetailDialog>
                    <ExerciseMedia image={`/${ex.image}`} gif={`/${ex.gif_url}`} name={localized.name} />
                    <div className="px-2 pt-4 pb-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                          {labels[ex.category] ?? ex.category}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">#{ex.id}</span>
                      </div>
                      <h3
                        lang={localized.locale}
                        className="text-base leading-6 font-semibold capitalize group-hover:text-primary"
                      >
                        {localized.name}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="gray" className="text-[10px]">
                          {labels[ex.equipment] ?? ex.equipment}
                        </Badge>
                        <Badge variant="lightPrimary" className="text-[10px]">
                          {labels[ex.target] ?? ex.target}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="items-center py-16 text-center">
              <SearchX className="size-10 text-muted-foreground" />
              <h3 className="text-xl font-semibold">{t("empty")}</h3>
              <p className="text-muted-foreground">{t("emptyHint")}</p>
              <Button asChild>
                <Link href={path}>{t("clear")}</Link>
              </Button>
            </Card>
          )}
          <nav
            aria-label={t("page", { current: query.page, total: pages })}
            className="flex items-center justify-between pt-6"
          >
            {query.page > 1 ? (
              <Button asChild variant="outline">
                <Link href={queryHref(path, { ...query, page: query.page - 1 })} rel="prev">
                  <ArrowLeft />
                  {t("previous")}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled aria-disabled="true">
                <ArrowLeft />
                {t("previous")}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {query.page} / {pages}
            </span>
            {query.page < pages ? (
              <Button asChild variant="outline">
                <Link href={queryHref(path, { ...query, page: query.page + 1 })} rel="next">
                  {t("next")}
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled aria-disabled="true">
                {t("next")}
                <ArrowRight />
              </Button>
            )}
          </nav>
        </section>
      </div>
    </>
  );
}
