import express from "express";
import { Router } from "express";
import * as bcrypt from "bcryptjs";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { createClientProfile } from "../controllers/clientController";
import authenticateWithSupabase from "../middleware/authenticateWithSupabase";
import { pool } from "../config/db";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Added for supabase from clientController
router.post("/client/create-profile", createClientProfile);

// New route: GET /api/client/me - returns Postgres client row mapped to Supabase user
router.get("/me", authenticateWithSupabase, async (req, res) => {
  try {
    const supabaseId = req.user?.id;
    if (!supabaseId) return res.status(401).json({ message: "Unauthorized" });

    const q = `SELECT id, full_name, email, phone_number, company_name, company_reg_number, created_at FROM clients WHERE supabase_id = $1`;
    const result = await pool.query(q, [supabaseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client mapping not found (call /auth/create-client after signup)" });
    }

    res.json({ client: result.rows[0] });
  } catch (err) {
    console.error("GET /client/me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// At the top of clientRoutes.ts, after imports
console.log("🔄 Client routes loaded - POST /signup should be available");

// Create client signup endpoint
router.post("/signup", authenticate, createClientProfile, async (req, res) => {
  console.log("Signup request body:", req.body);
  const { clientName, clientEmail, phoneNumber, companyName, companyNumber, password } = req.body;

  if (!clientName || !clientEmail || !phoneNumber || !companyName || !companyNumber || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO clients (full_name, email, phone_number, company_name, company_reg_number, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name;
    `;
    const values = [clientName, clientEmail, phoneNumber, companyName, companyNumber, hashedPassword];

    const result = await pool.query(query, values);
    res.status(201).json({ message: "Client account created!", client: result.rows[0] });

  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/client/me/funding-requests - get authenticated client's requests
router.get("/me/funding-requests", authenticateWithSupabase, async (req, res) => {
  const supabaseId = req.user?.id;
  const clientRes = await pool.query("SELECT id FROM clients WHERE supabase_id = $1", [supabaseId]);
  const clientId = clientRes.rows[0]?.id;
  
  const result = await pool.query(
    "SELECT id, funding_type, status, created_at FROM funding_requests WHERE client_id = $1 ORDER BY created_at DESC",
    [clientId]
  );
  res.json({ requests: result.rows });
});

///////////DOCUMENT UPLOAD////////////
// Multer memory storage for S3 uploads
const upload = multer({ storage: multer.memoryStorage() });

// AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const bucketName = process.env.AWS_S3_BUCKET!;

// Replace Azure upload route with AWS S3 upload
router.post("/upload-document", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const fileKey = `${Date.now()}-${path.basename(req.file.originalname)}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3.send(command);

    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    res.json({ message: "File uploaded!", url: fileUrl });
  } catch (err) {
    console.error("S3 upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/////////// FUNDING REQUEST ROUTE ///////////////
router.post("/funding-request", upload.any(), async (req, res) => {
  try {
    const {
      client_id,
      funding_type,
      purchase_order_value,
      funding_amount,
      end_user_department
    } = req.body;

    // Upload attached files to S3 and collect URLs
    const fileUrls: { [key: string]: string } = {};
    for (const file of req.files as Express.Multer.File[]) {
      const fileKey = `${Date.now()}-${path.basename(file.originalname)}`;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await s3.send(command);
      const keyName = file.fieldname || file.originalname;
      fileUrls[keyName] = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    }

    const query = `
      INSERT INTO funding_requests 
      (client_id, type, purchase_order_value, funding_amount, end_user_department, documents)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;

    const values = [
      client_id,
      funding_type,
      purchase_order_value,
      funding_amount,
      end_user_department,
      fileUrls // ensure the DB column is JSON/JSONB
    ];

    const result = await pool.query(query, values);

    res.json({
      message: "Funding request submitted",
      requestId: result.rows[0].id,
      documents: fileUrls
    });

  } catch (err) {
    console.error("Funding request error:", err);
    res.status(500).json({ message: "Server error submitting request" });
  }
});

export default router;
