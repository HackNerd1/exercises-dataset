import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {locales} from '../src/i18n/config';
import {getTaxonomy} from '../src/i18n/taxonomy';

const exercises = JSON.parse(readFileSync(new URL('../data/exercises.json', import.meta.url), 'utf8')) as Record<string, unknown>[];
const fields = ['category', 'body_part', 'equipment', 'target', 'secondary_muscles', 'muscle_group'];
const sourceValues = [...new Set(exercises.flatMap(exercise => fields.flatMap(field => {
  const value = exercise[field];
  return Array.isArray(value) ? value as string[] : typeof value === 'string' ? [value] : [];
})))].sort();

for (const locale of locales) {
  test(`${locale} taxonomy covers every dataset category, equipment and muscle value`, () => {
    const labels = getTaxonomy(locale);
    assert.deepEqual(Object.keys(labels).sort(), sourceValues);
    for (const value of sourceValues) {
      assert.ok(labels[value]?.trim(), `Missing ${locale} label for ${value}`);
      if (locale === 'en') assert.equal(labels[value], value);
    }
  });
}

test('aliases share translated anatomy labels without changing English source values', () => {
  const zh = getTaxonomy('zh');
  assert.equal(zh.abs, '腹肌');
  assert.equal(zh.abdominals, zh.abs);
  assert.equal(zh.quadriceps, zh.quads);
  assert.equal(getTaxonomy('en').quadriceps, 'quadriceps');
});

test('returned labels cannot mutate later requests or other locales', () => {
  const labels = getTaxonomy('zh');
  labels.abs = 'changed';
  delete labels.barbell;
  assert.equal(getTaxonomy('zh').abs, '腹肌');
  assert.equal(getTaxonomy('zh').barbell, '杠铃');
  assert.equal(getTaxonomy('en').abs, 'abs');
});
