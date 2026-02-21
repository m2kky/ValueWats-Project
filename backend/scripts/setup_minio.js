const { S3Client, CreateBucketCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env' });

const s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true
});

async function createBucket() {
    const bucketName = 'valuewats';

    try {
        console.log(`Creating bucket '${bucketName}'...`);
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log('✅ Bucket created successfully.');

        // Make it public (read-only) for media
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: "*",
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucketName}/*`]
                }
            ]
        };

        console.log('Setting bucket policy...');
        await s3.send(new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(policy)
        }));
        console.log('✅ Bucket policy set to public read-only.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createBucket();
