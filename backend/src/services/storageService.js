const { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require("@smithy/node-http-handler");
const https = require("https");
const path = require('path');
const fs = require('fs');

// MinIO/S3 Configuration
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1', // MinIO doesn't care about region, but SDK requires it
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO (uses path-style URLs instead of virtual-hosted)
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
  }),
});

const BUCKET_NAME = process.env.S3_BUCKET || 'valuewats-media';

const ensureBucketExists = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket ${BUCKET_NAME} not found. Creating...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`Bucket ${BUCKET_NAME} created successfully.`);
      } catch (err) {
        console.error('Failed to create bucket:', err);
      }
    }
  }

  // Set Public Policy
  try {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicRead",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
      ]
    };
    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(policy)
    }));
    console.log(`Bucket ${BUCKET_NAME} policy set to public-read.`);
  } catch (err) {
    console.error('Failed to set bucket policy:', err);
  }
};

/**
 * Upload a file to S3/MinIO
 * @param {Object} file - Multer file object { filename, originalname, mimetype, path, buffer }
 * @returns {string} Public URL of the uploaded file
 */
const uploadFile = async (file) => {
  await ensureBucketExists();

  const fileKey = `media/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // Read file from disk (multer diskStorage)
  const fileContent = fs.readFileSync(file.path);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: 'public-read', // Ensure public access if policy allows
  });

  await s3Client.send(command);

  // Clean up local temp file
  try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

  // Return public URL
  // If S3_PUBLIC_URL is set, use it. Otherwise fall back to endpoint/bucket
  const endpoint = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || 'http://localhost:9000';
  // Ensure no double slash
  const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return `${baseUrl}/${BUCKET_NAME}/${fileKey}`;
};

module.exports = { uploadFile, s3Client, BUCKET_NAME };
