const express = require('express');
const {
  getProfile,
  updateProfile,
  submitApplication,
  uploadDocuments,
  deleteDocument,
  getApplicationStatus,
  getCategories,
  getApprovedProviders
} = require('../controllers/providerController');
const protect = require('../middlewares/authMiddleware');
const { upload, documentFields } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/approved', getApprovedProviders);
router.get('/categories', getCategories);

// Protected routes (requires Bearer JWT)
router.use(protect);


/**
 * @swagger
 * tags:
 *   name: Provider
 *   description: Service provider onboarding endpoints (all require a provider JWT)
 */

/**
 * @swagger
 * /api/provider/profile:
 *   get:
 *     summary: Get own onboarding profile, documents and categories
 *     tags: [Provider]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Profile payload } }
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/provider/profile:
 *   put:
 *     summary: Update own profile (only before approval)
 *     tags: [Provider]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Updated profile completion } }
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /api/provider/submit:
 *   post:
 *     summary: Submit / resubmit the application for review
 *     tags: [Provider]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Application submitted } }
 */
router.post('/submit', submitApplication);

/**
 * @swagger
 * /api/provider/documents:
 *   post:
 *     summary: Upload profile photo and verification documents (multipart/form-data)
 *     tags: [Provider]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile_photo: { type: string, format: binary }
 *               government_id: { type: array, items: { type: string, format: binary } }
 *               address_proof: { type: array, items: { type: string, format: binary } }
 *               certification: { type: array, items: { type: string, format: binary } }
 *               background_check: { type: array, items: { type: string, format: binary } }
 *     responses: { 201: { description: Files uploaded } }
 */
router.post('/documents', upload.fields(documentFields), uploadDocuments);

/**
 * @swagger
 * /api/provider/documents/{id}:
 *   delete:
 *     summary: Delete an uploaded document (before approval only)
 *     tags: [Provider]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses: { 200: { description: Document removed } }
 */
router.delete('/documents/:id', deleteDocument);

/**
 * @swagger
 * /api/provider/status:
 *   get:
 *     summary: Get application status and document summary
 *     tags: [Provider]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Application status } }
 */
router.get('/status', getApplicationStatus);

/**
 * @swagger
 * /api/provider/categories:
 *   get:
 *     summary: List active service categories
 *     tags: [Provider]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Category list } }
 */
router.get('/categories', getCategories);

module.exports = router;