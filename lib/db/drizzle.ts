import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const { hostname, port, pathname, username, password } = new URL(
  process.env.DATABASE_URL
);

const connection = mysql.createPool({
  host: hostname,
  port: Number(port) || 3306,
  user: username,
  password: password || undefined, // Handle empty password
  database: pathname.slice(1),
  connectionLimit: 20,
  queueLimit: 0,
  waitForConnections: true,
});

export const db = drizzle(connection, { schema, mode: "default" });
export type Database = typeof db;
