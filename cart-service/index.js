require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import utilities
const logger = require('./utils/logger');
const { authenticateToken } = require('./middleware/auth');
const cartRoutes = require('./routes/cart');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    logger.info(`${method} ${url}`, {
      method,
      url,
      statusCode,
      ip,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://vitalbites.com'] // Replace with actual domain
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting for cart operations
const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    error: 'Too many cart requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Cart rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many cart requests from this IP, please try again after 15 minutes.'
    });
  }
});

app.use(cartLimiter);

// Database connection with better error handling
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/cartdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
  logger.info('Cart DB connected successfully');
})
.catch((error) => {
  logger.error('Database connection failed:', error);
  process.exit(1);
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Enhanced JWT Middleware with better error handling
const enhancedAuthenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            logger.warn('Cart access denied: No token provided', { ip: req.ip, url: req.url });
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'Authentication token required' 
            });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                logger.warn('Invalid token used in cart service', { 
                    ip: req.ip, 
                    url: req.url,
                    error: err.message 
                });
                
                const message = err.name === 'TokenExpiredError' 
                    ? 'Token has expired' 
                    : 'Invalid token';
                    
                return res.status(403).json({ 
                    error: 'Access denied',
                    message 
                });
            }
            
            req.user = user;
            logger.debug('User authenticated for cart access', { 
                userId: user.id, 
                role: user.role 
            });
            next();
        });
    } catch (error) {
        logger.error('Cart authentication middleware error:', {
            error: error.message,
            ip: req.ip,
            url: req.url
        });
        
        res.status(500).json({ 
            error: 'Authentication error',
            message: 'Internal server error during authentication' 
        });
    }
};

// Routes
app.use('/api/cart', enhancedAuthenticateToken, cartRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Cart Service is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error in cart service:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong!' 
        : err.message;

    res.status(err.status || 500).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    logger.info(`Cart Service started successfully on port ${PORT}`);
});
