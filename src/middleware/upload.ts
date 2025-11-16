// server/routes/fundingRequestRoutes.ts
import { Router, Request, Response } from "express";
import authenticate from "../middleware/authenticate";
import { Pool } from "pg";
import { uploadFilesToGithub } from "../utils/uploadToGithub";
import { upload } from "../middleware/render";

const router = Router();

// ======================
// DATABASE CONNECTION
// ======================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ======================
// REQUIRED FILES
// ======================
const REQUIRED_DOCS = [
  "tax_certificate",
  "6_month_bank_statement",
  "id_copy",
  "csd_report",
  "company_registration_document",
  "supplier_quotation",
  "purchase_order_or_company_invoice",
];

// ======================
// GET CLIENT FUNDING REQUESTS
// ======================
router.get(
  "/client/funding-requests",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const clientId = req.user.id;

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

// ======================
// CREATE NEW FUNDING REQUEST
// ======================
router.post(
  "/client/funding-request",
  authenticate,
  upload.fields(REQUIRED_DOCS.map((doc) => ({ name: doc }))),
  async (req: Request, res: Response) => {
    try {
      const clientId = req.user.id;
      const { company_name, end_user_department, funding_type, funding_amount } =
        req.body;

      // Validate required fields
      if (!company_name || !end_user_department || !funding_type || !funding_amount) {
        return res.status(400).json({ message: "Missing required request fields" });
      }

      // Validate uploaded files
      const uploadedFiles: { name: string; path: string }[] = [];
      for (const doc of REQUIRED_DOCS) {
        const fileArray = (req.files as any)?.[doc];
        if (!fileArray || fileArray.length === 0) {
          return res.status(400).json({ message: `Missing required file: ${doc}` });
        }
        uploadedFiles.push({
          name: fileArray[0].originalname,
          path: fileArray[0].path, // local file path
        });
      }

      // Insert request into DB
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

      // Upload to GitHub as secondary storage
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
