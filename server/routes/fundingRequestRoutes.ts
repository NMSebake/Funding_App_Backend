import { Router, Request, Response } from "express";
import authenticate from "../middleware/authenticate";
import { Pool } from "pg";
import { uploadFilesToGithub } from "../utils/uploadToGithub";
// import upload from "../middleware/upload"; // <-- cleaned import
import multer from "multer";

const router = Router();

// ======================
// DATABASE
// ======================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ======================
// REQUIRED DOCUMENT LIST
// ======================
const REQUIRED_DOCS = [
  "tax_certificate",
  "6_month_bank_statement",
  "id_copy",
  "csd_report",
  "company_registration_document",
  "supplier_quotation",
  "purchase_order_or_company_invoice",
] as const;

// ======================
// GET ALL FUNDING REQUESTS
// ======================
router.get(
  "https://equity-bridge-suite.onrender.com/client/funding-requests",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const clientId = (req as any).user.id;

      const result = await pool.query(
        `SELECT id, funding_type, status, created_at 
         FROM funding_requests 
         WHERE client_id = $1
         ORDER BY created_at DESC`,
        [clientId]
      );

      res.json({ requests: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


const upload = multer({ dest: "uploads/" });
// ======================
// CREATE FUNDING REQUEST
// ======================
router.post(
  "https://equity-bridge-suite.onrender.com/client/funding-request",
  authenticate,
  upload.fields(REQUIRED_DOCS.map((name) => ({ name }))), // <-- multer local upload
  async (req: Request, res: Response) => {
    try {
      const clientId = (req as any).user.id;

      const {
        company_name,
        end_user_department,
        funding_type,
        funding_amount,
      } = req.body;

      if (
        !company_name ||
        !end_user_department ||
        !funding_type ||
        !funding_amount
      ) {
        return res
          .status(400)
          .json({ message: "Missing required request fields" });
      }

      // Validate & collect files
      const uploadedFiles: { name: string; path: string }[] = [];

      for (const doc of REQUIRED_DOCS) {
        const fileArray = (req.files as any)?.[doc];

        if (!fileArray || fileArray.length === 0) {
          return res.status(400).json({
            message: `Missing required file: ${doc}`,
          });
        }

        uploadedFiles.push({
          name: fileArray[0].originalname,
          path: fileArray[0].path, // <-- local disk path (NOT S3)
        });
      }

      // Insert into database
      const insertQuery = `
        INSERT INTO funding_requests
        (client_id, company_name, end_user_department, funding_type, funding_amount, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'Pending', NOW())
        RETURNING id
      `;

      const result = await pool.query(insertQuery, [
        clientId,
        company_name,
        end_user_department,
        funding_type,
        funding_amount,
      ]);

      const requestId = result.rows[0].id;

      // Upload files to GitHub
      const folderName = `${company_name}_${end_user_department}`
        .replace(/\s+/g, "_")
        .toLowerCase();

      await uploadFilesToGithub(folderName, uploadedFiles);

      res.json({
        message: "Funding request submitted successfully",
        requestId,
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
