import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {locales} from '../src/i18n/config';
import {localizeName} from '../src/lib/exercises/localize';
import {filterExercises} from '../src/lib/exercises/search';
import type {Exercise, ExerciseQuery} from '../src/lib/exercises/types';

const exercises: Exercise[] = JSON.parse(readFileSync(new URL('../data/exercises.json', import.meta.url), 'utf8'));

test('every exercise has ten nonempty names and preserves its original English name', () => {
  for (const exercise of exercises) {
    assert.equal(exercise.names?.en, exercise.name, exercise.id);
    for (const locale of locales) {
      assert.ok(exercise.names?.[locale]?.trim(), `${exercise.id}.${locale}`);
      assert.deepEqual(localizeName(exercise, locale), {name:exercise.names?.[locale], locale});
    }
  }
});

test('missing, empty and whitespace translations fall back to English', () => {
  const exercise = exercises[0];
  for (const names of [undefined, {}, {zh:''}, {zh:'   '}, {en:' ', zh:' '}]) {
    assert.deepEqual(localizeName({...exercise, names}, 'zh'), {name:exercise.name, locale:'en'});
  }
  assert.deepEqual(localizeName({...exercise, names:{en:'English fallback'}}, 'fr'), {name:'English fallback',locale:'en'});
});

test('translated names and original English names find the same exercise', () => {
  const exercise = exercises[0];
  const query: ExerciseQuery = {q:'',category:[],equipment:[],target:[],page:1,pageSize:24,sort:'name-asc'};
  for (const locale of locales) {
    const results = filterExercises(exercises, {...query,q:exercise.names![locale]!});
    assert.ok(results.some(ex => ex.id === exercise.id), locale);
  }
  assert.equal(filterExercises(exercises, {...query,q:'not-a-real-translated-exercise-00000'}).length, 0);
});
