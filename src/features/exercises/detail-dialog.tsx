'use client';
import {Drawer, DrawerContent} from '@/components/ui/drawer';
import {Trigger, Title} from '@radix-ui/react-dialog';
import {useTranslations} from 'next-intl';
export function DetailDialog({name, children}: {name: string; children: React.ReactNode}) {
  const t = useTranslations('UI');
  return <Drawer>
    <Trigger asChild><button type="button" aria-label={name} className="absolute inset-0 z-10 cursor-pointer rounded-xl" /></Trigger>
    <DrawerContent closeLabel={t('close')} aria-describedby={undefined}>
      <Title className="sr-only">{name}</Title>
      {children}
    </DrawerContent>
  </Drawer>;
}
