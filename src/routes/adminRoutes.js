const express = require('express');
const {
  getProviders,
  getProviderDetail,
  reviewApplication,
  reviewDocument,
  removeProviderDocument,
  getDashboardStats,
  createCategory,
  listCategories,
  getAdminBookings,
  updateAdminBookingStatus
} = require('../controllers/adminController');
const {
  getAdminServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const protect = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

const router = express.Router();

// All admin routes are protected and admin-only
router.use(protect, authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints
 */

/**
 * @swagger
 * /api/admin/providers:
 *   get:
 *     summary: List all providers (search, filter, pagination)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: search, in: query, schema: { type: string }, description: "Search by name or email" }
 *       - { name: status, in: query, schema: { type: string, enum: [pending, approved, rejected, in_review] } }
 *       - { name: category, in: query, schema: { type: string }, description: "Category id" }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 10 } }
 *     responses: { 200: { description: Paginated providers } }
 */
router.get('/providers', getProviders);

/**
 * @swagger
 * /api/admin/providers/{id}:
 *   get:
 *     summary: Get a provider with documents
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Provider detail } }
 */
router.get('/providers/:id', getProviderDetail);

/**
 * @swagger
 * /api/admin/providers/{id}/review:
 *   put:
 *     summary: Approve or reject a provider application
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *               remarks: { type: string, description: "Required when rejecting" }
 *     responses: { 200: { description: Application reviewed } }
 */
router.put('/providers/:id/review', reviewApplication);

/**
 * @swagger
 * /api/admin/providers/{id}/documents/{docId}/review:
 *   put:
 *     summary: Verify or reject an individual document
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: docId, in: path, required: true, schema: { type: string } }
 *     responses: { 200: { description: Document reviewed } }
 */
router.put('/providers/:id/documents/:docId/review', reviewDocument);
router.delete('/providers/:id/documents/:docId', removeProviderDocument);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Dashboard statistics
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Stats } }
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Category list } }
 */
router.get('/categories', listCategories);

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: Create a new service category
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Home Cleaning" }
 *               icon: { type: string, example: "🧹" }
 *               description: { type: string }
 *     responses: { 201: { description: Category created } }
 */
router.post('/categories', createCategory);

// Service & Pricing Management routes
router.get('/services', getAdminServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// Admin Work Tracking & Bookings routes
router.get('/bookings', getAdminBookings);
router.put('/bookings/:id', updateAdminBookingStatus);

module.exports = router;