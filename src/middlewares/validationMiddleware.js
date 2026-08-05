const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Collects express-validator errors and passes them to the error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new ApiError(400, messages[0], errors.array()));
  }
  return next();
};

module.exports = validate;