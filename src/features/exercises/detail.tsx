import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { getTaxonomy } from "@/i18n/taxonomy";
import type { Exercise } from "@/lib/exercises/types";
import { localizeInstructions, localizeName } from "@/lib/exercises/localize";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExerciseMedia } from "@/features/exercises/media";

export async function ExerciseDetail({ exercise: ex, locale }: { exercise: Exercise; locale: Locale }) {
  const t = await getTranslations("UI");
  const labels = getTaxonomy(locale);
  const localized = localizeName(ex, locale);
  const instructions = localizeInstructions(ex, locale);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Card className="gap-4 p-3">
            <ExerciseMedia image={`/${ex.image}`} gif={`/${ex.gif_url}`} name={localized.name} large />
            <p className="pb-2 text-center text-xs text-muted-foreground">{ex.attribution}</p>
          </Card>
        </div>
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Badge variant="lightPrimary">{labels[ex.category] ?? ex.category}</Badge>
            <span className="font-mono text-xs text-muted-foreground">#{ex.id}</span>
          </div>
          <h1
            lang={localized.locale}
            className="text-3xl leading-tight font-semibold tracking-tight capitalize sm:text-4xl"
          >
            {localized.name}
          </h1>
          <dl className="my-7 grid grid-cols-2 gap-5 border-y border-border py-6">
            {[
              ["equipment", ex.equipment],
              ["target", ex.target],
            ].map(([key, value]) => (
              <div key={key}>
                <dt className="mb-2 text-xs text-muted-foreground">{t(key)}</dt>
                <dd className="font-medium">{labels[value] ?? value}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mb-5 text-xl font-semibold">{t("instructions")}</h2>
          <ol lang={instructions.locale} className="space-y-5">
            {instructions.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span
                  aria-label={t("step", { number: i + 1 })}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lightprimary text-xs font-semibold text-primary"
                >
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-7 text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">{t("secondaryMuscles")}</h2>
            <div className="flex flex-wrap gap-2">
              {ex.secondary_muscles.map((value) => (
                <Badge key={value} variant="gray">
                  {labels[value] ?? value}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
