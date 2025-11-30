import { Router, Request, Response } from "express";
import authenticateWithSupabase from "../middleware/authenticateWithSupabase";
import multer from "multer";
import { pool } from "../config/db";
import { uploadFileToS3 } from "../utils/s3";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const REQUIRED_DOCS = [
  "tax_certificate",
  "six_month_bank_statement",
  "id_copy",
  "csd_report",
  "company_registration_document",
  "supplier_quotation",
  "purchase_order_or_company_invoice",
] as const;

type ReqFiles = Record<string, Express.Multer.File[]>;

router.post(
  "/client/funding-request",
  authenticateWithSupabase,
  upload.fields(REQUIRED_DOCS.map((name) => ({ name }))),

  async (req: Request, res: Response) => {
    try {
      // 1) get supabase user id
      const supabaseId = req.user?.id;
      if (!supabaseId) return res.status(401).json({ message: "Unauthorized" });

      // 2) map to clients.id
      const clientRes = await pool.query("SELECT id FROM clients WHERE supabase_id = $1", [supabaseId]);
      if (clientRes.rows.length === 0) {
        return res.status(404).json({ message: "Client mapping not found. Please call /api/auth/create-client after signup." });
      }
      const clientId = clientRes.rows[0].id;

      // 3) validate body fields
      const {
        company_name,
        end_user_department,
        funding_type,
        funding_amount,
        purchase_order_value,
      } = (req.body || {}) as any;

      if (!company_name || !end_user_department || !funding_type || !funding_amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // 4) ensure files exist
      const files = req.files as unknown as ReqFiles;
      for (const doc of REQUIRED_DOCS) {
        if (!files || !files[doc] || files[doc].length === 0) {
          return res.status(400).json({ message: `Missing required file: ${doc}` });
        }
      }

      // 5) Upload each file to S3
      const uploadedUrls: Record<string, string> = {};
      const folder = `clients/${clientId}`;

      for (const doc of REQUIRED_DOCS) {
        const file = files[doc][0];
        const url = await uploadFileToS3(file.buffer, file.originalname, folder);
        uploadedUrls[doc] = url;
      }

      // 6) Insert DB row
      const insertQuery = `
        INSERT INTO funding_requests (
          client_id,
          company_name,
          end_user_department,
          funding_type,
          funding_amount,
          purchase_order_value,
          status,
          created_at,
          tax_certificate,
          six_month_bank_statement,
          id_copy,
          csd_report,
          company_registration_document,
          supplier_quotation,
          purchase_order_or_company_invoice
        ) VALUES (
          $1,$2,$3,$4,$5,$6,'Pending',NOW(),$7,$8,$9,$10,$11,$12,$13
        ) RETURNING id;
      `;

      const values = [
        clientId,
        company_name,
        end_user_department,
        funding_type,
        funding_amount,
        purchase_order_value || funding_amount,
        uploadedUrls.tax_certificate,
        uploadedUrls.six_month_bank_statement,
        uploadedUrls.id_copy,
        uploadedUrls.csd_report,
        uploadedUrls.company_registration_document,
        uploadedUrls.supplier_quotation,
        uploadedUrls.purchase_order_or_company_invoice,
      ];

      const result = await pool.query(insertQuery, values);
      const requestId = result.rows[0].id;

      return res.status(201).json({ message: "Funding request submitted", requestId });
    } catch (err) {
      console.error("Error submitting funding request:", err);
      return res.status(500).json({ message: "Server error submitting request" });
    }
  }
);

export default router;
