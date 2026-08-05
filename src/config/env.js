const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/onboarding_portal',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 10),
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@onboard.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123'
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    secure: process.env.SMTP_SECURE === 'true',
    from: process.env.MAIL_FROM || 'Service Provider Onboarding <no-reply@onboard.com>'
  }
};

module.exports = env;