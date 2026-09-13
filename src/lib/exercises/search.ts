import { filterKeys, type Exercise, type ExerciseQuery } from './types';

export function filterExercises(exercises: Exercise[], query: ExerciseQuery, labels: Record<string, string> = {}) {
  const term = query.q.toLocaleLowerCase();
  const filtered = exercises.filter(ex => {
    if (!filterKeys.every(key => !query[key].length || query[key].includes(ex[key]))) return false;
    const fields = [ex.id, ex.name, ...Object.values(ex.names ?? {}), ex.category, ex.body_part, ex.equipment, ex.target, ex.muscle_group, ...ex.secondary_muscles];
    return !term || fields.flatMap(v => [v, labels[v] ?? '']).join(' ').toLocaleLowerCase().includes(term);
  });
  return filtered.sort((a, b) => {
    const order = a.name.localeCompare(b.name, 'en');
    return (query.sort === 'name-desc' ? -order : order) || a.id.localeCompare(b.id);
  });
}
