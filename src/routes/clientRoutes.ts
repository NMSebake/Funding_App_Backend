import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { createClientProfile, getFundingRequests } from "../controllers/clientController";
import authenticateWithSupabase from "../middleware/authenticateWithSupabase";
import { authenticate } from "../middleware/authenticate";
import { pool } from "../config/db";

const router = Router();

/* -------------------------------------------
   1. CREATE PROFILE (after Supabase signup)
-------------------------------------------- */
router.post("/client/create-profile", createClientProfile);

/* -------------------------------------------
   2. GET funding requests (mapped via Supabase ID)
-------------------------------------------- */
router.get("/client/funding-requests", authenticateWithSupabase, getFundingRequests);

/* -------------------------------------------
   3. GET logged-in client profile
-------------------------------------------- */
router.get("/client/me", authenticateWithSupabase, async (req, res) => {
  try {
    const supabaseId = req.user?.id;
    if (!supabaseId) return res.status(401).json({ message: "Unauthorized" });

    const q = `
      SELECT id, full_name, email, phone_number, company_name, company_reg_number, created_at 
      FROM clients WHERE supabase_id = $1
    `;
    const result = await pool.query(q, [supabaseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Client profile not found. Complete onboarding first.",
      });
    }

    res.json({ client: result.rows[0] });
  } catch (err) {
    console.error("GET /client/me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------
   4. LEGACY SIGNUP (uses bcrypt—not Supabase)
-------------------------------------------- */
router.post("/client/signup", async (req, res) => {
  console.log("Signup request:", req.body);

  const {
    clientName,
    clientEmail,
    phoneNumber,
    companyName,
    companyNumber,
    password,
  } = req.body;

  if (!clientName || !clientEmail || !phoneNumber || !companyName || !companyNumber || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO clients (full_name, email, phone_number, company_name, company_reg_number, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name;
    `;

    const values = [
      clientName,
      clientEmail,
      phoneNumber,
      companyName,
      companyNumber,
      hashedPassword,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Client account created!",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* -------------------------------------------
   5. DOCUMENT UPLOAD → S3
-------------------------------------------- */
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// S3 bucket (Render uses S3_BUCKET not AWS_S3_BUCKET)
const bucketName =
  process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;

router.post("/client/upload-document", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const fileKey = `${Date.now()}-${path.basename(req.file.originalname)}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    res.json({ message: "File uploaded!", url });
  } catch (err) {
    console.error("S3 upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/* -------------------------------------------
   6. SUBMIT FUNDING REQUEST
-------------------------------------------- */
router.post("/client/funding-request", authenticateWithSupabase, upload.any(), async (req, res) => {
  try {
    const supabaseId = req.user?.id;
    if (!supabaseId) return res.status(401).json({ message: "Unauthorized" });

    // Map supabase to client_id
    const clientRes = await pool.query(
      "SELECT id FROM clients WHERE supabase_id = $1",
      [supabaseId]
    );

    if (clientRes.rows.length === 0) {
      return res.status(404).json({
        message: "Client profile missing — complete onboarding.",
      });
    }

    const clientId = clientRes.rows[0].id;
    const { funding_type, purchase_order_value, funding_amount, end_user_department } = req.body;

    // Upload documents
    const fileUrls: Record<string, string> = {};

    for (const file of req.files as Express.Multer.File[]) {
      const fileKey = `${Date.now()}-${file.originalname}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      fileUrls[file.fieldname] =
        `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    }

    // Insert request
    const insertQuery = `
      INSERT INTO funding_requests (
        client_id, type, purchase_order_value, funding_amount, end_user_department, documents
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;

    const values = [
      clientId,
      funding_type,
      purchase_order_value,
      funding_amount,
      end_user_department,
      fileUrls,
    ];

    const result = await pool.query(insertQuery, values);

    res.json({
      message: "Funding request submitted",
      requestId: result.rows[0].id,
      documents: fileUrls,
    });
  } catch (err) {
    console.error("Funding request error:", err);
    res.status(500).json({ message: "Server error submitting request" });
  }
});

export default router;
