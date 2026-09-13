import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {locales} from '../src/i18n/config';
import {databases, isDatabase, type Database} from '../src/lib/exports/databases';
import {createTable, insertExercise, sqlColumns, sqlValue} from '../src/lib/exports/sql';
import type {Exercise} from '../src/lib/exercises/types';

const exercises: Exercise[] = JSON.parse(readFileSync(new URL('../data/exercises.json', import.meta.url), 'utf8'));
const dialects = Object.keys(databases) as Database[];
const difficult = "O'Brien \\ 中文 हिन्दी 한글 🚀\nsecond line";

for (const db of dialects) {
  test(`${db} preserves NULL, empty strings, quotes, backslashes and Unicode`, () => {
    assert.equal(sqlValue(null, db), 'NULL');
    assert.equal(sqlValue(undefined, db), 'NULL');
    assert.notEqual(sqlValue('NULL', db), 'NULL');
    assert.equal(sqlValue('', db), db === 'mssql' ? "N''" : db === 'postgresql' ? "E''" : "''");
    const literal = sqlValue(difficult, db);
    let decoded: string;
    if (db === 'mysql') {
      const match = /^CONVERT\(0x([\da-f]+) USING utf8mb4\)$/.exec(literal);
      assert.ok(match);
      decoded = Buffer.from(match[1], 'hex').toString('utf8');
    } else {
      const prefix = db === 'mssql' ? "N'" : db === 'postgresql' ? "E'" : "'";
      assert.ok(literal.startsWith(prefix));
      assert.ok(literal.endsWith("'"));
      decoded = literal.slice(prefix.length, -1).replace(/''/g, "'");
      if (db === 'postgresql') decoded = decoded.replace(/\\\\/g, '\\');
    }
    assert.equal(decoded, difficult);
  });

  test(`${db} DDL and inserts contain all ten instruction languages and preserve string IDs`, () => {
    const ddl = createTable(db);
    assert.equal(new Set(sqlColumns).size, sqlColumns.length);
    assert.match(ddl, db === 'mssql' ? /id NVARCHAR\(10\) PRIMARY KEY/ : /id VARCHAR\(10\) PRIMARY KEY/);
    if (db === 'mysql') assert.match(ddl, /CHARACTER SET utf8mb4/);
    if (db === 'mssql') assert.match(ddl, /instructions_zh NVARCHAR\(MAX\)/);
    for (const locale of locales) assert.ok(ddl.includes(`instructions_${locale} `));
    const fixture = {...exercises[0], name: difficult, instructions: Object.fromEntries(locales.map(locale => [locale, `${locale}: ${difficult}`]))};
    const insert = insertExercise(fixture, db);
    assert.ok(insert.includes(sqlValue('0001', db)));
    assert.ok(insert.includes(sqlValue(difficult, db)));
    for (const locale of locales) assert.ok(insert.includes(sqlValue(fixture.instructions[locale], db)));
    assert.ok(insert.includes(sqlValue(JSON.stringify(fixture.secondary_muscles), db)));
    assert.ok(insert.includes(sqlValue(JSON.stringify(fixture.instruction_steps), db)));
  });
}

test('SQLite export executes and losslessly round trips every field of the complete dataset', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(createTable('sqlite'));
    db.exec('BEGIN');
    for (const exercise of exercises) db.exec(insertExercise(exercise, 'sqlite'));
    db.exec('COMMIT');
    const rows = db.prepare('SELECT * FROM exercises').all();
    assert.equal(rows.length, exercises.length);
    const byId = new Map(rows.map(row => [row.id, row]));
    for (const exercise of exercises) {
      const row = byId.get(exercise.id);
      assert.ok(row, exercise.id);
      for (const column of sqlColumns) {
        if (column.startsWith('instructions_')) {
          const locale = column.slice('instructions_'.length) as typeof locales[number];
          assert.equal(row[column], exercise.instructions[locale] ?? '', `${exercise.id}.${column}`);
        } else if (column === 'instruction_steps' || column === 'secondary_muscles' || column === 'names') {
          assert.deepEqual(JSON.parse(String(row[column])), exercise[column]);
        } else {
          assert.equal(row[column], exercise[column as keyof Exercise] ?? null, `${exercise.id}.${column}`);
        }
      }
    }
    assert.equal(byId.get('0001')?.id, '0001');
  } finally {db.close();}
});

test('SQLite executes adversarial text and SQL NULL without adding statements', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(createTable('sqlite'));
    const fixture = {...exercises[0], name: "'); DROP TABLE exercises; -- " + difficult, attribution: null} as unknown as Exercise;
    db.exec(insertExercise(fixture, 'sqlite'));
    const row = db.prepare('SELECT name, attribution FROM exercises').get();
    assert.equal(row?.name, fixture.name);
    assert.equal(row?.attribution, null);
  } finally {db.close();}
});

test('database validation accepts supported dialects and rejects unknown or inherited keys', () => {
  for (const db of dialects) assert.equal(isDatabase(db), true);
  for (const db of ['', 'unknown', 'POSTGRESQL', '__proto__', 'constructor', 'toString']) {
    assert.equal(isDatabase(db), false);
  }
});
