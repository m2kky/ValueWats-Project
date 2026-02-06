require('dotenv').config();
const { execSync } = require('child_process');

console.log('DATABASE_URL:', process.env.DATABASE_URL);

try {
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
