import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import jwt from "jsonwebtoken";
import authenticateWithSupabase from "../middleware/authenticateWithSupabase";

const router = express.Router();

/* ----------------------------------------
   CLIENT SIGNUP
----------------------------------------- */
router.post("/client/signup", async (req, res) => {
  const { full_name, email, password, phone_number, company_name, company_reg_number } = req.body;

  // Validation
  if (!full_name || !email || !password || !company_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO clients 
      (full_name, email, password_hash, phone_number, company_name, company_reg_number) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id`,
      [
        full_name,
        email,
        hashedPassword,
        phone_number || null,
        company_name,
        company_reg_number || null
      ]
    );

    res.status(201).json({
      message: "Client registered successfully",
      clientId: result.rows[0].id,
    });

  } catch (error: any) {
    console.error("Signup error:", error);

    if (error.code === "23505") {
      return res.status(400).json({ message: "Email already registered" });
    }

    res.status(500).json({ message: "Error registering client" });
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
