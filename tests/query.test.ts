import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {getTaxonomy} from '../src/i18n/taxonomy';
import {localizeInstructions} from '../src/lib/exercises/localize';
import {parseQuery, queryHref, serializeQuery, toSearchParams} from '../src/lib/exercises/query';
import {filterExercises} from '../src/lib/exercises/search';
import {filterKeys, type Exercise, type Facets} from '../src/lib/exercises/types';

const exercises: Exercise[] = JSON.parse(readFileSync(new URL('../data/exercises.json', import.meta.url), 'utf8'));
const facets = Object.fromEntries(filterKeys.map(key => [key, [...new Set(exercises.map(ex => ex[key]))]])) as Facets;
const query = (search = '') => parseQuery(new URLSearchParams(search), facets);

test('real dataset combines values within a facet with OR and different facets with AND', () => {
  const selected = query('category=chest&category=back&equipment=barbell&equipment=dumbbell&target=lats&target=pectorals');
  const actual = filterExercises(exercises, selected);
  const expected = exercises.filter(ex => ['chest', 'back'].includes(ex.category)
    && ['barbell', 'dumbbell'].includes(ex.equipment) && ['lats', 'pectorals'].includes(ex.target));
  assert.ok(expected.length > 0);
  assert.deepEqual(actual.map(ex => ex.id).sort(), expected.map(ex => ex.id).sort());
  for (const category of selected.category) assert.ok(actual.some(ex => ex.category === category));
  for (const equipment of selected.equipment) assert.ok(actual.some(ex => ex.equipment === equipment));
});

test('query rejects unknown facets, duplicates and invalid pagination or sort', () => {
  const parsed = query('category=back&category=back&category=unknown&equipment=__proto__&target=abs&sort=random&page=-1&pageSize=25');
  assert.deepEqual(parsed.category, ['back']);
  assert.deepEqual(parsed.equipment, []);
  assert.deepEqual(parsed.target, ['abs']);
  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 24);
  assert.equal(parsed.sort, 'name-asc');
  for (const page of ['0', '-2', '1.5', 'NaN', 'Infinity', '9007199254740992', '']) {
    assert.equal(query(`page=${page}`).page, 1, page);
  }
  assert.equal(query('page=3&page=4').page, 3);
  for (const size of [24, 48, 96]) assert.equal(query(`pageSize=${size}`).pageSize, size);
  assert.equal(query(`q=${'a'.repeat(120)}`).q.length, 100);
});

test('query serialization is canonical and round trips Unicode, spaces and repeated values', () => {
  const input = toSearchParams({q: '  哑铃 & chest  ', category: ['chest', 'back', 'back'], equipment: 'body weight', page: '2', pageSize: '48', sort: 'name-desc', ignored: undefined});
  const parsed = parseQuery(input, facets);
  const serialized = serializeQuery(parsed);
  assert.deepEqual(parseQuery(new URLSearchParams(serialized), facets), parsed);
  assert.equal(serializeQuery(parseQuery(new URLSearchParams(serialized), facets)), serialized);
  assert.equal(new URLSearchParams(serialized).get('q'), '哑铃 & chest');
  assert.deepEqual(new URLSearchParams(serialized).getAll('category'), ['back', 'chest']);
  assert.equal(queryHref('/zh/exercises', query()), '/zh/exercises');
  assert.equal(queryHref('/zh/exercises', parsed), `/zh/exercises?${serialized}`);
});

test('Chinese taxonomy labels are searchable and string IDs retain leading zeroes', () => {
  const result = filterExercises(exercises, query('q=哑铃'), getTaxonomy('zh'));
  assert.ok(result.length > 0);
  for (const exercise of exercises.filter(ex => ex.equipment === 'dumbbell')) assert.ok(result.some(ex => ex.id === exercise.id));
  assert.ok(filterExercises(exercises, query('q=0001')).some(ex => ex.id === '0001'));
  assert.equal(typeof exercises.find(ex => ex.id === '0001')?.id, 'string');
  assert.equal(filterExercises(exercises, query('q=nonexistent-exercise-123456')).length, 0);
});

test('sort changes direction without mutating the source dataset', () => {
  const before = exercises.map(ex => ex.id);
  const ascending = filterExercises(exercises, query());
  const descending = filterExercises(exercises, query('sort=name-desc'));
  assert.equal(ascending[0].name, descending.at(-1)?.name);
  assert.equal(ascending.at(-1)?.name, descending[0].name);
  assert.deepEqual(exercises.map(ex => ex.id), before);
});

test('instructions prefer locale steps, then locale prose, then English and handle empty translations', () => {
  const fixture = {...exercises[0], instruction_steps: {zh: [' ', '中文步骤'], en: ['English step']}, instructions: {zh: '中文段落', en: 'English prose'}};
  assert.deepEqual(localizeInstructions(fixture, 'zh'), {steps: ['中文步骤'], locale: 'zh'});
  fixture.instruction_steps.zh = [' '];
  assert.deepEqual(localizeInstructions(fixture, 'zh'), {steps: ['中文段落'], locale: 'zh'});
  fixture.instructions.zh = ' ';
  assert.deepEqual(localizeInstructions(fixture, 'zh'), {steps: ['English step'], locale: 'en'});
  fixture.instruction_steps.en = [];
  assert.deepEqual(localizeInstructions(fixture, 'zh'), {steps: ['English prose'], locale: 'en'});
  fixture.instructions.en = '';
  assert.deepEqual(localizeInstructions(fixture, 'zh'), {steps: [], locale: 'zh'});
});
