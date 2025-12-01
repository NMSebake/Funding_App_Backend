import { Request, Response } from "express";
import { pool } from "../db";

// Create a client profile after Supabase signup
export const createClientProfile = async (req: Request, res: Response) => {
  try {
    const {
      supabase_id,
      full_name,
      email,
      phone_number,
      company_name,
      company_reg_number
    } = req.body;

    if (!supabase_id) {
      return res.status(400).json({ error: "Missing supabase_id" });
    }

    // Check if profile already exists
    const existing = await pool.query(
      "SELECT * FROM clients WHERE supabase_id = $1 LIMIT 1",
      [supabase_id]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]); // Return existing profile
    }

    // Insert new client profile
    const result = await pool.query(
      `INSERT INTO clients (
        supabase_id,
        full_name,
        email,
        phone_number,
        company_name,
        company_reg_number
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        supabase_id,
        full_name,
        email,
        phone_number,
        company_name,
        company_reg_number
      ]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creating client profile:", error);
    return res.status(500).json({ error: "Server error creating client profile" });
  }
};

export const getFundingRequests = async (req: Request, res: Response) => {
  try {
    const supabaseId = req.user?.id;

    if (!supabaseId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT * FROM funding_requests WHERE supabase_id = $1 ORDER BY created_at DESC",
      [supabaseId]
    );

    return res.json(result.rows);

  } catch (error) {
    console.error("Error fetching funding requests:", error);
    return res.status(500).json({ error: "Server error fetching funding requests" });
  }
};

