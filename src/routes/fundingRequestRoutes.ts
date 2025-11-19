import { Router, Request, Response } from "express";
import authenticate from "../middleware/authenticate";
import { Pool } from "pg";
// import upload from "../middleware/upload"; // <-- cleaned import
import multer from "multer";
import { uploadFileToBlob } from "../utils/azureBlob";

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
  "six_month_bank_statement",
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

const upload = multer({ storage: multer.memoryStorage() });

// ======================
// CREATE FUNDING REQUEST
// ======================
router.post(
  "https://equity-bridge-suite.onrender.com/client/funding-request",
  authenticate,
  upload.fields(REQUIRED_DOCS.map((name) => ({ name }))),
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

      // ======================
      // UPLOAD FILES TO AZURE BLOB
      // ======================
      const fileUrls: Record<string, string | null> = {};

      for (const doc of REQUIRED_DOCS) {
        const fileArray = (req.files as any)?.[doc];

        if (!fileArray || fileArray.length === 0) {
          return res.status(400).json({
            message: `Missing required file: ${doc}`,
          });
        }

        // Upload to Azure Blob Storage
        const file = fileArray[0];
        const blobUrl = await uploadFileToBlob(file);

        fileUrls[doc] = blobUrl;
      }

      // Insert into database
      const insertQuery = `
        INSERT INTO funding_requests (
          client_id, 
          company_name, 
          end_user_department, 
          funding_type, 
          funding_amount, 
          status, 
          created_at,
          tax_certificate,
          six_month_bank_statement,
          id_copy,
          csd_report,
          company_registration_document,
          supplier_quotation,
          purchase_order_or_company_invoice
        )
        VALUES (
          $1, $2, $3, $4, $5, 'Pending', NOW(),
          $6, $7, $8, $9, $10, $11, $12
        )
        RETURNING id;
      `;

      const values = [
        clientId,
        company_name,
        end_user_department,
        funding_type,
        funding_amount,
        fileUrls.tax_certificate,
        fileUrls.six_month_bank_statement,
        fileUrls.id_copy,
        fileUrls.csd_report,
        fileUrls.company_registration_document,
        fileUrls.supplier_quotation,
        fileUrls.purchase_order_or_company_invoice,
      ];

      const result = await pool.query(insertQuery, values);
      const requestId = result.rows[0].id;

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
