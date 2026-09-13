import {notFound} from 'next/navigation';
import {isLocale} from '@/i18n/config';
import {getExercises} from '@/lib/exercises/repository.server';
import {localizeName} from '@/lib/exercises/localize';
import {pageMetadata} from '@/lib/seo';
import {ExerciseDetail} from '@/features/exercises/detail';

type Props = {params: Promise<{locale: string; id: string}>};

async function getDetail(params: Props['params']) {
  const {locale, id} = await params;
  if (!isLocale(locale)) notFound();
  const exercise = (await getExercises()).find(item => item.id === id);
  if (!exercise) notFound();
  return {locale, exercise};
}

export async function generateMetadata({params}: Props) {
  const {locale, exercise} = await getDetail(params);
  const {name} = localizeName(exercise, locale);
  return pageMetadata(locale, `/exercises/${exercise.id}`, name, name);
}

export default async function ExercisePage({params}: Props) {
  const {locale, exercise} = await getDetail(params);
  return <ExerciseDetail exercise={exercise} locale={locale}/>;
}
