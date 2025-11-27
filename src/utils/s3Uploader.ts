import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

export const uploadToS3 = async (file: Express.Multer.File, key: string) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read"
  };

  const upload = await s3.upload(params).promise();

  return upload.Location; // <-- Public URL
};
