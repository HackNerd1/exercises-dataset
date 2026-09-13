
'use client';
import Link from 'next/link';
import {useEffect, useOptimistic, useRef, useTransition} from 'react';
import type {MouseEvent} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {Check, Search, SlidersHorizontal} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {filterKeys, type ExerciseQuery, type Facets} from '@/lib/exercises/types';
import {parseQuery, queryHref, serializeQuery} from '@/lib/exercises/query';

export function Filters({query, facets, labels, destination, embedded = false}: {query: ExerciseQuery; facets: Facets; labels: Record<string,string>; destination?: string; embedded?: boolean}) {
  const t = useTranslations('UI');
  const currentPath = usePathname();
  const path = destination ?? currentPath;
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const awaitingQuery = useRef<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useOptimistic(query);

  useEffect(() => {
    const restoreHistory = () => {clearTimeout(timer.current); timer.current = undefined; awaitingQuery.current = null;};
    window.addEventListener('popstate', restoreHistory);
    return () => {restoreHistory(); window.removeEventListener('popstate', restoreHistory);};
  }, []);
  useEffect(() => {
    // Preserve a newer search draft while an earlier SSR response is arriving.
    if (timer.current || (awaitingQuery.current !== null && awaitingQuery.current !== serializeQuery(query))) return;
    awaitingQuery.current = null;
    form.current?.reset();
  }, [query]);

  function navigate(next: ExerciseQuery, method: 'push' | 'replace') {
    clearTimeout(timer.current); timer.current = undefined;
    awaitingQuery.current = serializeQuery(next);
    startTransition(() => {
      setSelected(next);
      router[method](queryHref(path,next), {scroll:false});
    });
  }
  function search() {
    if (!form.current) return;
    const params = new URLSearchParams();
    for (const [key,value] of new FormData(form.current)) if (typeof value === 'string') params.append(key,value);
    navigate({...parseQuery(params,facets),page:1}, 'replace');
  }
  function selectTag(event: MouseEvent<HTMLAnchorElement>, next: ExerciseQuery) {
    // Preserve native links for no-JS navigation and opening a filter in a new tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const draft = form.current ? String(new FormData(form.current).get('q') ?? '') : next.q;
    navigate({...next,q:draft.trim().slice(0,100),page:1},'push');
  }
  const tagClass = 'h-8 shrink-0 rounded-full border px-3 text-xs font-normal';
  return <Card aria-label={t('filters')} aria-busy={pending} className={embedded ? "gap-5 border-0 bg-transparent p-0 shadow-none" : "mb-8 gap-5 p-5 shadow-none sm:p-6"}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-base font-semibold"><SlidersHorizontal className="size-4 text-primary"/>{t('filters')}</h2>
      <Link href={path} className="text-xs text-muted-foreground underline underline-offset-4" onClick={() => {clearTimeout(timer.current); timer.current=undefined; awaitingQuery.current=null;}}>{t('clear')}</Link>
    </div>
    <form ref={form} action={path} method="get" onSubmit={event => {event.preventDefault();search();}}>
      <label htmlFor="exercise-search" className="sr-only">{t('search')}</label>
      <div className="relative"><Search className="pointer-events-none absolute top-3 left-3 z-10 size-4 text-muted-foreground"/>
        <Input id="exercise-search" name="q" defaultValue={query.q} maxLength={100} placeholder={t('searchPlaceholder')} className="bg-background pl-9" onChange={() => {
          clearTimeout(timer.current); timer.current=setTimeout(search,300);
        }}/>
      </div>
      {filterKeys.flatMap(key => selected[key].map(value => <input key={`${key}-${value}`} type="hidden" name={key} value={value}/>))}
      <input type="hidden" name="sort" value={selected.sort}/>
      <input type="hidden" name="pageSize" value={selected.pageSize}/>
    </form>
    <div className="space-y-4">
      {filterKeys.map(key => <div key={key} role="group" aria-label={t(key)} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-4">
        <span className="shrink-0 text-xs font-semibold text-muted-foreground sm:w-24 sm:pt-2">{t(key)}</span>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {facets[key].map(value => {
            const active=selected[key].includes(value);
            const next={...selected,page:1,[key]:active ? selected[key].filter(item=>item!==value) : [...selected[key],value]};
            return <Button key={value} asChild variant={active ? 'lightprimary' : 'ghost'} className={`${tagClass} ${active ? 'border-primary/30' : 'border-border text-muted-foreground'}`}>
              <Link prefetch={false} href={queryHref(path,next)} aria-current={active ? 'true' : undefined} onClick={event=>selectTag(event,next)}>
                {active && <Check aria-hidden="true" className="size-3"/>}{labels[value] ?? value}
              </Link>
            </Button>;
          })}
        </div>
      </div>)}
      <div role="group" aria-label={t('sort')} className="flex flex-wrap items-center gap-2 border-t border-border pt-4 sm:gap-4">
        <span className="w-full shrink-0 text-xs font-semibold text-muted-foreground sm:w-24">{t('sort')}</span>
        {(['name-asc','name-desc'] as const).map(sort => {
          const next={...selected,sort,page:1};
          return <Button key={sort} asChild variant={selected.sort===sort ? 'lightprimary' : 'ghost'} className={`${tagClass} ${selected.sort===sort ? 'border-primary/30' : 'border-border text-muted-foreground'}`}>
            <Link prefetch={false} href={queryHref(path,next)} aria-current={selected.sort===sort ? 'true' : undefined} onClick={event=>selectTag(event,next)}>{t(sort==='name-asc' ? 'ascending' : 'descending')}</Link>
          </Button>;
        })}
      </div>
    </div>
  </Card>;
}
