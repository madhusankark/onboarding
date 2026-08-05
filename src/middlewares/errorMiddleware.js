const multer = require('multer');
const env = require('../config/env');

// Central error handler - every error thrown in the app lands here
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || '';
  error.errors = Array.isArray(err.errors) ? err.errors : [];

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: `Invalid ${err.path} value: ${err.value}`
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = {
      statusCode: 409,
      message: `Duplicate value for ${field}. ${field} already exists.`
    };
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = { statusCode: 400, message: messages.join(', ') };
  }

  // Multer file size exceeded
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = { statusCode: 400, message: `File too large. Maximum size is ${env.maxFileSizeMb} MB.` };
    } else {
      error = { statusCode: 400, message: `Upload error: ${err.message}` };
    }
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('SERVER ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors.length ? error.errors : undefined,
    stack: env.nodeEnv === 'development' && statusCode >= 500 ? err.stack : undefined
  });
};

module.exports = errorHandler;