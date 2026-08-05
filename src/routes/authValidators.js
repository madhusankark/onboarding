const { body } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

const registerValidator = [
  body('name', 'Name is required').trim().notEmpty().isLength({ max: 80 }),
  body('email', 'A valid email is required').trim().isEmail().normalizeEmail(),
  body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  validate
];

const loginValidator = [
  body('email', 'A valid email is required').trim().isEmail().normalizeEmail(),
  body('password', 'Password is required').notEmpty(),
  validate
];

module.exports = { registerValidator, loginValidator };