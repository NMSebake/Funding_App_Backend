import { Router } from "express";
import multer from "multer";
import path from "path";
import { pool } from "../config/db";
import authenticateWithSupabase from "../middleware/authenticateWithSupabase";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const router = Router();

/* =====================================================
   CLIENT PROFILE (SUPABASE → POSTGRES)
   ===================================================== */
router.post("/create-profile", authenticateWithSupabase, async (req, res) => {
  try {
    const supabaseId = req.user?.id;
    if (!supabaseId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      full_name,
      email,
      phone_number,
      company_name,
      company_reg_number,
    } = req.body;

    // Prevent duplicates
    const existing = await pool.query(
      "SELECT * FROM clients WHERE supabase_id = $1",
      [supabaseId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      `
      INSERT INTO clients (
        supabase_id,
        full_name,
        email,
        phone_number,
        company_name,
        company_reg_number
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        supabaseId,
        full_name,
        email,
        phone_number,
        company_name,
        company_reg_number,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create profile error:", err);
    res.status(500).json({ message: "Failed to create client profile" });
  }
});

/* =====================================================
   GET CURRENT CLIENT (ME)
   ===================================================== */
router.get("/me", authenticateWithSupabase, async (req, res) => {
  try {
    const supabaseId = req.user?.id;

    const result = await pool.query(
      `SELECT id, full_name, email, phone_number, company_name, company_reg_number
       FROM clients WHERE supabase_id = $1`,
      [supabaseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   FUNDING REQUESTS
   ===================================================== */
router.get("/funding-requests", authenticateWithSupabase, async (req, res) => {
  try {
    const supabaseId = req.user?.id;

    const client = await pool.query(
      "SELECT id FROM clients WHERE supabase_id = $1",
      [supabaseId]
    );

    if (client.rows.length === 0) {
      return res.status(404).json({ message: "Client not onboarded" });
    }

    const requests = await pool.query(
      "SELECT * FROM funding_requests WHERE client_id = $1 ORDER BY created_at DESC",
      [client.rows[0].id]
    );

    res.json({ requests: requests.rows });
  } catch (err) {
    console.error("Funding requests error:", err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

/* =====================================================
   DOCUMENT UPLOAD (AWS S3)
   ===================================================== */
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucket = process.env.S3_BUCKET!;

router.post("/upload-document", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const key = `${Date.now()}-${path.basename(req.file.originalname)}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    res.json({
      url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (err) {
    console.error("S3 upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/* =====================================================
   CREATE FUNDING REQUEST
   ===================================================== */
router.post("/funding-request", authenticateWithSupabase, upload.any(), async (req, res) => {
  try {
    const supabaseId = req.user?.id;

    const client = await pool.query(
      "SELECT id FROM clients WHERE supabase_id = $1",
      [supabaseId]
    );

    if (client.rows.length === 0) {
      return res.status(404).json({ message: "Client not onboarded" });
    }

    const docs: Record<string, string> = {};

    for (const file of req.files as Express.Multer.File[]) {
      const key = `${Date.now()}-${file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
        })
      );
      docs[file.fieldname] = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    const result = await pool.query(
      `
      INSERT INTO funding_requests
      (client_id, type, purchase_order_value, funding_amount, end_user_department, documents)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        client.rows[0].id,
        req.body.funding_type,
        req.body.purchase_order_value,
        req.body.funding_amount,
        req.body.end_user_department,
        docs,
      ]
    );

    res.json({ requestId: result.rows[0].id });
  } catch (err) {
    console.error("Funding request error:", err);
    res.status(500).json({ message: "Submission failed" });
  }
});

export default router;
