// server/db.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Render managed Postgres
  },
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err: unknown) => console.error("❌ PostgreSQL connection error:", err));
