import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create MySQL connection
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 20,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
});

// Create Drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });

export type Database = typeof db; 