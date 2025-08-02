require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const app = express();

// Logging setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString() 
  });
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Proxy rules with error handling
const createProxy = (target, path) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${path}`]: path },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${path}:`, err.message);
      res.status(503).json({ 
        success: false, 
        error: 'Service temporarily unavailable' 
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      logger.info(`Proxying ${req.method} ${req.url} to ${target}`);
    }
  });
};

app.use('/api/auth', createProxy('http://auth-service:5000', '/api/auth'));
app.use('/api/menu', createProxy('http://menu-service:5001', '/api/menu'));
app.use('/api/orders', createProxy('http://order-service:5002', '/api/orders'));
app.use('/api/user', createProxy('http://user-service:5003', '/api/user'));
app.use('/api/cart', createProxy('http://cart-service:5004', '/api/cart'));
app.use('/api/notifications', createProxy('http://notification-service:5005', '/api/notifications'));
app.use('/api/admin', createProxy('http://admin-service:5006', '/api/admin'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(8080, () => {
  logger.info('API Gateway listening on port 8080');
});