import {locales} from '@/i18n/config';
import type {Exercise} from '@/lib/exercises/types';
import type {Database} from '@/lib/exports/databases';

const metadataFields = ['name','category','body_part','equipment','muscle_group','target','image','gif_url','media_id','attribution','created_at'] as const;
export const sqlColumns = ['id', ...metadataFields, ...locales.map(locale => `instructions_${locale}`), 'instruction_steps', 'secondary_muscles', 'names'];

export function createTable(db: Database): string {
  const text = db === 'mssql' ? 'NVARCHAR(MAX)' : db === 'mysql' ? 'LONGTEXT' : 'TEXT';
  const id = db === 'mssql' ? 'NVARCHAR(10)' : 'VARCHAR(10)';
  const columns = sqlColumns.map(column => `  ${column} ${column === 'id' ? `${id} PRIMARY KEY` : text}`);
  return `CREATE TABLE exercises (\n${columns.join(',\n')}\n)${db === 'mysql' ? ' CHARACTER SET utf8mb4' : ''};`;
}

export function sqlValue(value: unknown, db: Database): string {
  if (value === null || value === undefined) return 'NULL';
  const raw = String(value);
  // Hex literals avoid MySQL backslash-mode ambiguity and preserve Unicode exactly.
  if (db === 'mysql') return raw ? `CONVERT(0x${Buffer.from(raw,'utf8').toString('hex')} USING utf8mb4)` : "''";
  const escaped = raw.replace(/'/g,"''");
  if (db === 'postgresql') return `E'${escaped.replace(/\\/g,'\\\\')}'`;
  return `${db === 'mssql' ? 'N' : ''}'${escaped}'`;
}

export function insertExercise(exercise: Exercise, db: Database): string {
  const values = [exercise.id, ...metadataFields.map(key => exercise[key]), ...locales.map(locale => exercise.instructions[locale] ?? ''), JSON.stringify(exercise.instruction_steps), JSON.stringify(exercise.secondary_muscles), JSON.stringify(exercise.names ?? {en: exercise.name})];
  return `INSERT INTO exercises (${sqlColumns.join(', ')}) VALUES (${values.map(value => sqlValue(value, db)).join(', ')});\n`;
}
