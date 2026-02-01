import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

// Make database optional for initial Vercel deployment
let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'your-database-url-here') {
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Vercel serverless optimizations
      max: 1, // Limit connections for serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    db = drizzle(pool, { schema });
    console.log("Database connection established");
  } catch (error) {
    console.error("Failed to connect to database:", error);
  }
} else {
  console.warn("DATABASE_URL not configured - database features will not work");
}

export { pool, db };
