import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing');
}

const databaseUrl = new URL(process.env.DATABASE_URL);
const schemaName = databaseUrl.searchParams.get('schema');
if (schemaName) {
  databaseUrl.searchParams.delete('schema');
}

const client = postgres(
  databaseUrl.toString(),
  schemaName ? { connection: { search_path: schemaName } } : {},
);
export const db = drizzle(client, { schema });
