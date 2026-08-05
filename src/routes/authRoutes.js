const express = require('express');
const { register, login, getMe, updateUserProfile } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('./authValidators');
const protect = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & account management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new service provider
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "John Doe" }
 *               email: { type: string, example: "john@example.com" }
 *               password: { type: string, example: "Password@123" }
 *     responses:
 *       201:
 *         description: Account created
 *       409:
 *         description: Email already exists
 */
router.post('/register', registerValidator, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login (provider or admin)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "admin@onboard.com" }
 *               password: { type: string, example: "Admin@123" }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidator, login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user payload
 */
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateUserProfile);

module.exports = router;