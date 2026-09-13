import {getExercises} from '@/lib/exercises/repository.server';
import {createTable, insertExercise} from '@/lib/exports/sql';
import {isDatabase} from '@/lib/exports/databases';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(request: Request) {
  const db = new URL(request.url).searchParams.get('db') ?? 'postgresql';
  if (!isDatabase(db)) return Response.json({error:'Unsupported database'}, {status:400});
  const exercises = await getExercises();
  const encoder = new TextEncoder();
  let index = -1;
  // Stream one record at a time instead of buffering the multilingual export in memory.
  const stream = new ReadableStream<Uint8Array>({pull(controller) {
    if (index === -1) {
      controller.enqueue(encoder.encode(`-- Exercises Dataset | Media © Gym visual\n${createTable(db)}\n${db === 'mysql' ? 'START TRANSACTION;' : db === 'mssql' ? 'BEGIN TRANSACTION;' : 'BEGIN;'}\n`));
      index = 0;
    } else if (index < exercises.length) controller.enqueue(encoder.encode(insertExercise(exercises[index++],db)));
    else {controller.enqueue(encoder.encode('COMMIT;\n')); controller.close();}
  }});
  return new Response(stream, {headers:{'Content-Type':'application/sql; charset=utf-8','Content-Disposition':`attachment; filename="exercises-${db}.sql"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
