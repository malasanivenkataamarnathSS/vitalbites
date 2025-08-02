const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const Redis = require('redis');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');

// Route imports
const dashboardRoutes = require('./routes/dashboard');
const userManagementRoutes = require('./routes/userManagement');
const menuManagementRoutes = require('./routes/menuManagement');
const orderManagementRoutes = require('./routes/orderManagement');
const analyticsRoutes = require('./routes/analytics');
const systemRoutes = require('./routes/system');

const app = express();

// Redis client
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting - stricter for admin operations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30 // limit each IP to 30 requests per windowMs for admin
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'admin-service',
    timestamp: new Date().toISOString() 
  });
});

// Public routes (login, etc.)
app.use('/api/admin/auth', require('./routes/auth'));

// Protected admin routes
app.use('/api/admin/dashboard', authMiddleware, adminMiddleware, dashboardRoutes);
app.use('/api/admin/users', authMiddleware, adminMiddleware, userManagementRoutes);
app.use('/api/admin/menu', authMiddleware, adminMiddleware, menuManagementRoutes);
app.use('/api/admin/orders', authMiddleware, adminMiddleware, orderManagementRoutes);
app.use('/api/admin/analytics', authMiddleware, adminMiddleware, analyticsRoutes);
app.use('/api/admin/system', authMiddleware, adminMiddleware, systemRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Connect to Redis
redisClient.connect().then(() => {
  logger.info('Connected to Redis');
}).catch((error) => {
  logger.error('Redis connection error:', error);
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
  logger.info(`Admin service running on port ${PORT}`);
});

// Export Redis client for use in routes
module.exports = { redisClient };

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  redisClient.quit();
  mongoose.connection.close();
  process.exit(0);
});