import {readFile, access} from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const records = JSON.parse(await readFile('data/exercises.json', 'utf8'));
const schema = JSON.parse(await readFile('data/exercises.schema.json', 'utf8'));
const ajv = new Ajv2020({allErrors: true});
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(records)) throw new Error(JSON.stringify(validate.errors));
const ids = new Set();
for (const record of records) {
  if (ids.has(record.id)) throw new Error(`Duplicate ID: ${record.id}`);
  ids.add(record.id);
  await Promise.all([access(record.image), access(record.gif_url)]);
}
console.log(`Validated ${records.length} exercises and their media.`);
