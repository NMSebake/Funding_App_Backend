// utils/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET;

if (!region || !bucket) {
  console.error("AWS_REGION and S3_BUCKET env variables must be set");
  // Not exiting here because dev might want to run non-file parts
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadFileToS3(buffer: Buffer, originalName: string, folder = ""): Promise<string> {
  if (!bucket) throw new Error("S3_BUCKET not configured");

  const timestamp = Date.now();
  const safeName = `${timestamp}-${originalName.replace(/\s+/g, "_")}`;
  const key = folder ? `${folder}/${safeName}` : safeName;

  const contentType = getContentTypeByFile(originalName);

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read" // ensure bucket policy allows public read OR use signed URLs
  });

  await s3Client.send(cmd);

  // Public URL (works if bucket objects are public / or you configured proper policy)
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return url;
}

function getContentTypeByFile(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}
