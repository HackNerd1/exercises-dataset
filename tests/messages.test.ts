import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {locales} from '../src/i18n/config';

function flatten(value: unknown, prefix = ''): Record<string, string> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `Expected message object at ${prefix}`);
  return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'string' ? [[path, child]] : Object.entries(flatten(child, path));
  }));
}
const messages = (locale: string) => flatten(JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8')));
const reference = messages('en');
// Capture argument names, including ICU number/date/plural/select arguments.
const argumentsOf = (message: string) => [...new Set([...message.matchAll(/\{\s*([A-Za-z_][\w]*)\s*(?:,|\})/g)].map(match => match[1]))].sort();
for (const locale of locales) {
  test(`${locale} messages have identical keys and ICU arguments`, () => {
    const translated = messages(locale);
    assert.deepEqual(Object.keys(translated).sort(), Object.keys(reference).sort());
    for (const [key, message] of Object.entries(translated)) {
      assert.ok(message.trim(), `${locale}.${key} is blank`);
      assert.deepEqual(argumentsOf(message), argumentsOf(reference[key]), `${locale}.${key} arguments`);
    }
  });
}
