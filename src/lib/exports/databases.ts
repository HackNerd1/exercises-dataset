export const databases = {postgresql: 'PostgreSQL', mysql: 'MySQL', sqlite: 'SQLite', mssql: 'SQL Server'} as const;
export type Database = keyof typeof databases;
export function isDatabase(value: string): value is Database {return Object.hasOwn(databases,value);}
