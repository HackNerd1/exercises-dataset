import {cp, mkdir} from 'node:fs/promises';
await mkdir('public', {recursive: true});
for (const name of ['images', 'videos', 'data']) {
  await cp(name, `public/${name}`, {recursive: true});
}
for (const name of ['LICENSE', 'NOTICE.md']) await cp(name, `public/${name}`);
console.log('Static assets synchronized.');
