import express from "express";
import { pool } from "../config/db";

const router = express.Router();

/**
 * Create client record that maps to a Supabase user
 * Body: { supabase_id, full_name, email, phone_number?, company_name?, company_reg_number? }
 */
router.post("/create-client", async (req, res) => {
  const { supabase_id, full_name, email, phone_number, company_name, company_reg_number } = req.body;

  if (!supabase_id || !email || !full_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO clients (full_name, email, phone_number, company_name, company_reg_number, supabase_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (supabase_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone_number = EXCLUDED.phone_number,
        company_name = EXCLUDED.company_name,
        company_reg_number = EXCLUDED.company_reg_number
      RETURNING id;
    `;

    const values = [full_name, email, phone_number || null, company_name || null, company_reg_number || null, supabase_id];

    const result = await pool.query(query, values);
    res.status(201).json({ message: "Client record created/updated", clientId: result.rows[0].id });
  } catch (err: any) {
    console.error("create-client error:", err);
    res.status(500).json({ message: "Server error creating client" });
  }
});

export default router;
