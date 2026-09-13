import 'server-only';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {filterKeys, type Exercise, type ExerciseQuery, type Facets} from './types';
import {filterExercises} from './search';

let dataset: Promise<Exercise[]> | undefined;
export function getExercises(): Promise<Exercise[]> {
  // Each function instance reuses immutable data; no per-query/global response cache.
  return dataset ??= readFile(join(process.cwd(), 'data/exercises.json'), 'utf8').then(JSON.parse).catch(error => {
    dataset = undefined;
    throw error;
  });
}
export async function getFacets(): Promise<Facets> {
  const exercises = await getExercises();
  return Object.fromEntries(filterKeys.map(key => [key, [...new Set(exercises.map(ex => ex[key]))].sort()])) as Facets;
}
export async function listExercises(query: ExerciseQuery, labels: Record<string, string>) {
  const filtered = filterExercises(await getExercises(), query, labels);
  const pages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const normalized = {...query, page: Math.min(query.page, pages)};
  const offset = (normalized.page - 1) * query.pageSize;
  return {items: filtered.slice(offset, offset + query.pageSize), total: filtered.length, pages, query: normalized};
}
