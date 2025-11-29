import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import jwt from "jsonwebtoken";
import authenticateWithSupabase from "../middleware/authenticateWithSupabase";

const router = express.Router();

/* ----------------------------------------
   CLIENT SIGNUP
----------------------------------------- */
router.post("/client/signup", authenticateWithSupabase, async (req, res) => {
  const supabaseUserId = (req as any).user?.id;
  if (!supabaseUserId) return res.status(401).json({ message: "Unauthorized" });

  const { full_name, phone_number, company_name, company_reg_number } = req.body;

  if (!full_name || !company_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check if profile exists linked by supabase_id (you need a column supabase_id in clients table)
    const check = await pool.query("SELECT id FROM clients WHERE supabase_id = $1 LIMIT 1", [supabaseUserId]);
    if (check.rows.length > 0) {
      return res.json({ message: "Profile already exists", clientId: check.rows[0].id });
    }

    const result = await pool.query(
      `INSERT INTO clients 
       (supabase_id, full_name, email, phone_number, company_name, company_reg_number, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [
        supabaseUserId,
        full_name,
        (req as any).user.email || null,
        phone_number || null,
        company_name,
        company_reg_number || null
      ]
    );

    res.status(201).json({ message: "Client profile created", clientId: result.rows[0].id });
  } catch (err: any) {
    console.error("create-profile error:", err);
    res.status(500).json({ message: "Server error creating profile", error: err.message });
  }
});

/* ----------------------------------------
   CLIENT LOGIN
----------------------------------------- */
router.post("/client/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM clients WHERE email = $1", [email]);
    const client = result.rows[0];

    if (!client) return res.status(400).json({ message: "Client not found" });

    const isMatch = await bcrypt.compare(password, client.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: client.id, email: client.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,         // ← RETURN TOKEN
      clientId: client.id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
});


export default router;
