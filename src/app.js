const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

const errorHandler = require('./middlewares/errorMiddleware');
const ApiError = require('./utils/ApiError');
const env = require('./config/env');
const { uploadsPath } = require('./config/paths');

const app = express();

// Security / parsing middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.clientUrl.split(','), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === 'development') app.use(morgan('dev'));

// Global API rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Static uploads (profile photos & documents)
app.use('/uploads', express.static(uploadsPath));

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);


// 404 for unknown API routes
app.use('/api', (req, res, next) => next(new ApiError(404, `Route not found: ${req.originalUrl}`)));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;