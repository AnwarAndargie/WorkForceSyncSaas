import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import * as schema from './schema';

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔄 Setting up database...');

  try {
    // Create connection
    const connection = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 1,
    });

    // Create Drizzle instance
    const db = drizzle(connection, { schema });

    // Run migrations
    console.log('🔄 Running migrations...');
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    console.log('✅ Migrations completed successfully');

    // Close connection
    await connection.end();
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase }; 