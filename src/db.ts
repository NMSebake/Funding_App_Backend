// server/db.ts
import fs from 'fs';
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync('./certs/rds-ca.pem').toString(),
  },
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err: unknown) => console.error("❌ PostgreSQL connection error:", err));
