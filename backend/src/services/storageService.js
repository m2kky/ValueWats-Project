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

// Fix 2.3: Track if bucket has been verified (one-time at boot)
let bucketReady = false;

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
 * Fix 2.3: Initialize bucket once at server boot.
 * Call this from server.js instead of checking on every upload.
 */
const initBucket = async () => {
  await ensureBucketExists();
  bucketReady = true;
  console.log(`[StorageService] Bucket '${BUCKET_NAME}' ready.`);
};

/**
 * Upload a file to S3/MinIO
 * @param {Object} file - Multer file object { filename, originalname, mimetype, path, buffer }
 * @returns {string} Public URL of the uploaded file
 */
const uploadFile = async (file) => {
  // Fix 2.3: Only check bucket if boot init was skipped (safety fallback)
  if (!bucketReady) await ensureBucketExists();

  const fileKey = `media/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    // Fix 1.5: Validate file is not empty/corrupt before uploading
    const stat = fs.statSync(file.path);
    if (stat.size === 0) {
      throw new Error('Uploaded file is empty (0 bytes).');
    }

    // Fix 2.4: Use streaming instead of readFileSync for memory safety on large files
    const fileStream = fs.createReadStream(file.path);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: fileStream,
      ContentType: file.mimetype,
      ContentLength: stat.size,
      ACL: 'public-read',
    });

    await s3Client.send(command);
  } catch (err) {
    console.error('[StorageService] Upload failed:', err.message);
    throw err; // Let the calling controller return 400/500
  } finally {
    // Always clean up local temp file
    try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
  }

  // Return public URL
  const endpoint = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || 'http://localhost:9000';
  const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return `${baseUrl}/${BUCKET_NAME}/${fileKey}`;
};

/**
 * Upload media from base64 string to MinIO
 * @param {string} base64 - Base64 encoded file content
 * @param {string} mimetype - e.g. 'image/jpeg', 'audio/ogg'
 * @param {string} prefix - folder prefix e.g. 'chat-media'
 * @returns {string} Public URL
 */
const uploadBase64 = async (base64, mimetype, prefix = 'chat-media') => {
  // Fix 2.3: Only check bucket if boot init was skipped (safety fallback)
  if (!bucketReady) await ensureBucketExists();

  const ext = mimetype.split('/')[1]?.split(';')[0] || 'bin';
  const fileKey = `${prefix}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(base64, 'base64');

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: buffer,
    ContentType: mimetype,
  }));

  const endpoint = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || 'http://localhost:9000';
  const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return `${baseUrl}/${BUCKET_NAME}/${fileKey}`;
};

module.exports = { uploadFile, uploadBase64, initBucket, s3Client, BUCKET_NAME };
