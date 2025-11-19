import { Router } from "express";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import { BlobServiceClient } from "@azure/storage-blob";
import multer from "multer";

const router = Router();

// PostgreSQL pool connection
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
});

// At the top of clientRoutes.ts, after imports
console.log("🔄 Client routes loaded - POST /signup should be available");

// Create client signup endpoint
router.post("/signup", async (req, res) => {
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


// Get funding requests for a specific client
router.get("/:clientId/requests", async (req, res) => {
  const { clientId } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, type, status, date_submitted FROM funding_requests WHERE client_id = $1 ORDER BY date_submitted DESC",
      [clientId]
    );

    res.json(result.rows);

} catch (error: any) {
  console.error("Signup error:", error);
  res.status(500).json({ message: "Server error", error: error.message });
}

});


///////////DOCUMENT UPLOAD////////////
const upload = multer(); // For multipart/form-data

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER!);

router.post("/upload-document", upload.single("file"), async (req, res) => {
  try {
    const blobName = `${Date.now()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const fileUrl = blockBlobClient.url; // This is your public URL
    res.json({ message: "File uploaded!", url: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});


export default router;
