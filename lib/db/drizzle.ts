import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Parse the DATABASE_URL using the native URL constructor
const { hostname, port, pathname, username, password } = new URL(
  process.env.DATABASE_URL
);

const connection = mysql.createPool({
  host: hostname,
  port: Number(port),
  user: username,
  password,
  database: pathname.slice(1), // removes the leading slash
  connectionLimit: 20,
  queueLimit: 0,
  waitForConnections: true,
  // acquireTimeout: 60000,
  // connectTimeout: 60000,
});

// Create Drizzle instance
export const db = drizzle(connection, { schema, mode: "default" });

export type Database = typeof db;
