const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const Redis = require('redis');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Redis client for pub/sub
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

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
    service: 'notification-service',
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/notifications', notificationRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Handle authentication
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      
      // Join user-specific room
      socket.join(`user_${decoded.userId}`);
      
      // Join role-specific room
      socket.join(`role_${decoded.role}`);
      
      socket.emit('authenticated', { success: true, userId: decoded.userId });
      logger.info(`User ${decoded.userId} authenticated and joined rooms`);
    } catch (error) {
      socket.emit('authentication_error', { error: 'Invalid token' });
      logger.warn(`Authentication failed for socket ${socket.id}: ${error.message}`);
    }
  });

  // Handle order tracking subscription
  socket.on('subscribe_order', (orderId) => {
    if (socket.userId) {
      socket.join(`order_${orderId}`);
      logger.info(`User ${socket.userId} subscribed to order ${orderId}`);
    }
  });

  // Handle admin dashboard subscription
  socket.on('subscribe_admin_dashboard', () => {
    if (socket.role === 'admin') {
      socket.join('admin_dashboard');
      logger.info(`Admin ${socket.userId} subscribed to dashboard updates`);
    }
  });

  // Handle chat room subscription
  socket.on('join_chat', (roomId) => {
    if (socket.userId) {
      socket.join(`chat_${roomId}`);
      logger.info(`User ${socket.userId} joined chat room ${roomId}`);
    }
  });

  // Handle chat messages
  socket.on('send_message', (data) => {
    if (socket.userId) {
      const message = {
        id: Date.now(),
        userId: socket.userId,
        text: data.text,
        timestamp: new Date(),
        roomId: data.roomId
      };
      
      // Broadcast to chat room
      io.to(`chat_${data.roomId}`).emit('new_message', message);
      
      // Store message in Redis for history
      redisClient.lpush(`chat_${data.roomId}`, JSON.stringify(message));
      
      logger.info(`Message sent in room ${data.roomId} by user ${socket.userId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Redis pub/sub for cross-service notifications
redisClient.on('connect', () => {
  logger.info('Connected to Redis for pub/sub');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

// Subscribe to notification channels
redisClient.connect().then(() => {
  // Subscribe to order updates
  redisClient.subscribe('order_updates', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Emit to specific order room
      io.to(`order_${data.orderId}`).emit('order_update', data);
      
      // Emit to admin dashboard
      io.to('admin_dashboard').emit('admin_order_update', data);
      
      logger.info(`Order update broadcasted for order ${data.orderId}`);
    } catch (error) {
      logger.error('Error processing order update:', error);
    }
  });

  // Subscribe to user notifications
  redisClient.subscribe('user_notifications', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Emit to specific user
      io.to(`user_${data.userId}`).emit('notification', data);
      
      logger.info(`Notification sent to user ${data.userId}`);
    } catch (error) {
      logger.error('Error processing user notification:', error);
    }
  });

  // Subscribe to admin notifications
  redisClient.subscribe('admin_notifications', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Emit to all admins
      io.to('role_admin').emit('admin_notification', data);
      
      logger.info('Admin notification broadcasted');
    } catch (error) {
      logger.error('Error processing admin notification:', error);
    }
  });
});

// Helper functions for other services to use
const broadcastOrderUpdate = async (orderData) => {
  await redisClient.publish('order_updates', JSON.stringify(orderData));
};

const sendUserNotification = async (userId, notification) => {
  await redisClient.publish('user_notifications', JSON.stringify({
    userId,
    ...notification
  }));
};

const sendAdminNotification = async (notification) => {
  await redisClient.publish('admin_notifications', JSON.stringify(notification));
};

// Export functions for API routes
module.exports = {
  broadcastOrderUpdate,
  sendUserNotification,
  sendAdminNotification
};

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
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    redisClient.quit();
    mongoose.connection.close();
    process.exit(0);
  });
});