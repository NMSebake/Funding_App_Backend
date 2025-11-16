import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db";

const router = express.Router();

// CLIENT SIGNUP
router.post("https://equity-bridge-suite.onrender.com/client/signup", async (req, res) => {
  const { full_name, email, password, company_name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO clients (full_name, email, password_hash, phone_number, company_name, company_reg_number) VALUES ($1, $2, $3, $4) RETURNING id",
      [full_name, email, hashedPassword, company_name]
    );

    res.status(201).json({ message: "Client registered successfully", clientId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering client" });
  }
});

// CLIENT LOGIN
router.post("https://equity-bridge-suite.onrender.com/client/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM clients WHERE email = $1", [email]);
    const client = result.rows[0];

    if (!client) return res.status(400).json({ message: "Client not found" });

    const isMatch = await bcrypt.compare(password, client.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({ message: "Login successful", clientId: client.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
});

export default router;
