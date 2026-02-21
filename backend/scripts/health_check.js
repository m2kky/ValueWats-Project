require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const axios = require('axios');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

function log(status, message) {
    const color = status === 'OK' ? colors.green : (status === 'WARN' ? colors.yellow : colors.red);
    console.log(`${color}[${status}]${colors.reset} ${message}`);
}

async function checkDatabase() {
    process.stdout.write('Testing Database Connection... ');
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        console.log(`${colors.green}OK${colors.reset}`);
        log('OK', 'Connected to PostgreSQL');
        // Check for required extensions
        try {
            const vectorExt = await prisma.$queryRaw`SELECT * FROM pg_extension WHERE extname = 'vector'`;
            if (vectorExt.length > 0) {
                log('OK', 'pgvector extension enabled');
            } else {
                log('WARN', 'pgvector extension NOT found');
            }
        } catch (e) {
            log('WARN', `Could not check extensions: ${e.message}`);
        }
    } catch (error) {
        console.log(`${colors.red}FAILED${colors.reset}`);
        log('ERROR', `Database Error: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

async function checkRedis() {
    process.stdout.write('Testing Redis Connection... ');
    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        maxRetriesPerRequest: 1
    });

    try {
        await redis.ping();
        console.log(`${colors.green}OK${colors.reset}`);
        log('OK', `Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
    } catch (error) {
        console.log(`${colors.red}FAILED${colors.reset}`);
        log('ERROR', `Redis Error: ${error.message}`);
    } finally {
        redis.disconnect();
    }
}

async function checkEvolutionApi() {
    process.stdout.write('Testing Evolution API... ');
    const url = process.env.EVOLUTION_API_URL;
    const key = process.env.EVOLUTION_API_KEY;

    try {
        // Fetch instances as a health check
        const response = await axios.get(`${url}/instance/fetchInstances`, {
            headers: { apikey: key },
            timeout: 5000
        });
        console.log(`${colors.green}OK${colors.reset}`);
        log('OK', `Evolution API reachable (${response.data.length} instances found)`);
    } catch (error) {
        console.log(`${colors.red}FAILED${colors.reset}`);
        if (error.code === 'ECONNREFUSED') {
            log('ERROR', `Evolution API unreachable at ${url}`);
        } else if (error.response) {
            log('ERROR', `Evolution API Error: ${error.response.status} ${error.response.statusText}`);
        } else {
            log('ERROR', `Evolution API Error: ${error.message}`);
        }
    }
}

async function checkMinIO() {
    process.stdout.write('Testing MinIO (S3)... ');

    // Check if S3 is configured
    if (!process.env.S3_ENDPOINT) {
        console.log(`${colors.yellow}SKIPPED${colors.reset}`);
        log('WARN', 'MinIO not configured (S3_ENDPOINT missing)');
        return;
    }

    const s3 = new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
        },
        forcePathStyle: true
    });

    try {
        const data = await s3.send(new ListBucketsCommand({}));
        console.log(`${colors.green}OK${colors.reset}`);
        log('OK', `MinIO reachable (${data.Buckets.length} buckets found)`);

        const bucketName = process.env.S3_BUCKET || 'valuewats';
        const bucketExists = data.Buckets.some(b => b.Name === bucketName);
        if (bucketExists) {
            log('OK', `Bucket '${bucketName}' exists`);
        } else {
            log('WARN', `Bucket '${bucketName}' NOT found`);
        }

    } catch (error) {
        console.log(`${colors.red}FAILED${colors.reset}`);
        log('ERROR', `MinIO Error: ${error.message}`);
    }
}

async function run() {
    console.log(`${colors.cyan}--- ValueWats Health Check ---${colors.reset}\n`);

    await checkDatabase();
    await checkRedis();
    await checkEvolutionApi();
    await checkMinIO();

    console.log(`\n${colors.cyan}--- Check Complete ---${colors.reset}`);
}

run();
