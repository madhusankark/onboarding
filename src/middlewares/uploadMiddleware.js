const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

// Allowed MIME types for document uploads
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
];

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Build a multer storage engine that saves files into a destination folder
 * whose name is derived from the request user's id (keeps things organised).
 */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const userIdStr = req.user ? String(req.user._id || req.user.id) : 'anonymous';
    const folder = path.join(env.uploadDir, userIdStr);
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPG, PNG, WEBP, GIF or PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 }
});

// Field definitions for provider document uploads
const documentFields = [
  { name: 'profile_photo', maxCount: 1 },
  { name: 'government_id', maxCount: 3 },
  { name: 'address_proof', maxCount: 3 },
  { name: 'certification', maxCount: 5 },
  { name: 'background_check', maxCount: 3 },
  { name: 'other', maxCount: 5 }
];

module.exports = { upload, documentFields, ALLOWED_MIMES, IMAGE_MIMES };