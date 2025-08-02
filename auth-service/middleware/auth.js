const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Enhanced JWT middleware with better error handling
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Access denied: No token provided', { ip: req.ip, url: req.url });
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'Authentication token required' 
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn('Invalid token used', { 
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
      logger.debug('User authenticated successfully', { 
        userId: user.id, 
        role: user.role 
      });
      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error:', {
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

// Role-based authorization middleware
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization check failed: No user in request');
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'Authentication required' 
      });
    }

    if (req.user.role !== requiredRole) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole
      });
      
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Admin role middleware
const requireAdmin = requireRole('admin');

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin
};