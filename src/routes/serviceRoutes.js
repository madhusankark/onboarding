const express = require('express');
const { getServices } = require('../controllers/serviceController');

const router = express.Router();

// Public route to list services with prices
router.get('/', getServices);

module.exports = router;
