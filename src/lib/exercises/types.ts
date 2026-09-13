import type {Locale} from '@/i18n/config';
export type Exercise = {
  id: string; name: string; category: string; body_part: string; equipment: string;
  target: string; muscle_group: string; secondary_muscles: string[];
  image: string; gif_url: string; media_id: string; attribution: string; created_at: string;
  names?: Partial<Record<Locale, string>>;
  instructions: Partial<Record<Locale, string>>;
  instruction_steps: Partial<Record<Locale, string[]>>;
};
export const filterKeys = ['category', 'equipment', 'target'] as const;
export type FilterKey = (typeof filterKeys)[number];
export type Facets = Record<FilterKey, string[]>;
export type ExerciseQuery = Record<FilterKey, string[]> & {
  q: string; page: number; pageSize: number; sort: 'name-asc' | 'name-desc';
};
export type SearchParams = Record<string, string | string[] | undefined>;
