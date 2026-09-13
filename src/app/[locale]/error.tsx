'use client';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
export default function ErrorPage({reset}: {reset: () => void}) {
  const t = useTranslations('UI');
  return <section role="alert" className="py-20 text-center"><h1 className="mb-6 text-2xl font-semibold">{t('error')}</h1><Button onClick={reset}>{t('retry')}</Button></section>;
}
