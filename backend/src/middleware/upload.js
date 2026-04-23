const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // timestamp_filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ====== Fix 1.6: MIME Type Whitelist (re-enabled) ======
// Strict allow-list for safe file types. XLSX has inconsistent MIME types across browsers,
// so we check both extension AND MIME where possible.
const ALLOWED_EXTENSIONS = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mp3|ogg|wav|pdf|doc|docx|csv|txt|xlsx|xls/;
const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/ogg', 'audio/wav',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
  'text/plain',
  // XLSX fallback MIME types (browsers are inconsistent)
  'application/octet-stream',
];

const fileFilter = (req, file, cb) => {
  const extValid = ALLOWED_EXTENSIONS.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = ALLOWED_MIMES.includes(file.mimetype);

  // Fix 1.5: Reject if extension is not in our whitelist (primary defense)
  if (!extValid) {
    return cb(new Error(`File type not allowed. Accepted: images, videos, audio, PDF, CSV, Excel.`));
  }

  // For known-tricky types (xlsx/xls), allow by extension only since MIME is unreliable.
  // For everything else, check MIME too.
  const isSpreadsheet = /xlsx|xls|csv/.test(path.extname(file.originalname).toLowerCase());
  if (!isSpreadsheet && !mimeValid) {
    return cb(new Error(`File MIME type ${file.mimetype} not allowed.`));
  }

  cb(null, true);
};

// ====== Fix 1.7: Aligned size limit with Nginx (50MB) ======
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — aligned with Nginx client_max_body_size
  fileFilter: fileFilter
});

module.exports = upload;
