import {filterKeys, type ExerciseQuery, type Facets, type SearchParams} from './types';

export function toSearchParams(input: SearchParams): URLSearchParams {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    for (const entry of Array.isArray(value) ? value : value === undefined ? [] : [value]) result.append(key, entry);
  }
  return result;
}

export function parseQuery(params: URLSearchParams, facets: Facets): ExerciseQuery {
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize'));
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    category: [], equipment: [], target: [],
    ...Object.fromEntries(filterKeys.map(key => [key, [...new Set(params.getAll(key))].filter(v => facets[key].includes(v)).sort()])),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: [24, 48, 96].includes(pageSize) ? pageSize : 24,
    sort: params.get('sort') === 'name-desc' ? 'name-desc' : 'name-asc',
  };
}

export function serializeQuery(query: ExerciseQuery): string {
  const result = new URLSearchParams();
  if (query.q) result.set('q', query.q);
  for (const key of filterKeys) for (const value of [...new Set(query[key])].sort()) result.append(key, value);
  if (query.page > 1) result.set('page', String(query.page));
  if (query.pageSize !== 24) result.set('pageSize', String(query.pageSize));
  if (query.sort !== 'name-asc') result.set('sort', query.sort);
  return result.toString();
}
export function queryHref(path: string, query: ExerciseQuery): string {
  const search = serializeQuery(query);
  return search ? `${path}?${search}` : path;
}
