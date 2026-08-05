const ApiError = require('../utils/ApiError');

// Restricts a route to specific roles, e.g. authorize('admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authorized'));
  }
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, `Access denied. Requires role: ${roles.join(' or ')}`));
  }
  return next();
};

module.exports = authorize;