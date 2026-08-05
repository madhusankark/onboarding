const { verifyToken } = require('../services/tokenService');
const { User } = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the Bearer JWT and attaches the current user to req.user
const protect = asyncHandler(async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization || '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized - no token provided. Please login.'));
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return next(new ApiError(401, 'Not authorized - token invalid or expired. Please login again.'));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ApiError(401, 'Not authorized - user no longer exists.'));
  }
  if (!user.isActive) {
    return next(new ApiError(403, 'Your account has been deactivated. Contact support.'));
  }

  req.user = user;
  next();
});

module.exports = protect;