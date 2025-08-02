require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import enhanced middleware and utilities
const { 
  orderLimiter, 
  orderPlacementLimiter,
  adminLimiter, 
  securityHeaders, 
  requestLogger, 
  errorHandler, 
  validateRequest 
} = require('./middleware/security');
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const logger = require('./utils/logger');
const {
  orderSchema,
  orderStatusUpdateSchema,
  orderQuerySchema
} = require('./validators/orderValidators');

const Order = require('./models/Order');

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://vitalbites.com'] // Replace with actual domain
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Database connection with better error handling
mongoose.connect(process.env.MONGO_URL, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  logger.info('Order DB connected successfully');
})
.catch((error) => {
  logger.error('Database connection failed:', error);
  process.exit(1);
});

// Place order
app.post('/api/orders', 
  orderPlacementLimiter,
  authenticateToken,
  validateRequest(orderSchema),
  async (req, res) => {
    try {
      const { items, address, phone, total, paymentMethod, specialInstructions } = req.body;
      const userId = req.user.id;

      // Validate that calculated total matches items
      const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tolerance = 0.01; // Allow for minor floating point differences
      
      if (Math.abs(calculatedTotal - total) > tolerance) {
        logger.warn('Order total mismatch', {
          userId,
          providedTotal: total,
          calculatedTotal,
          items
        });
        return res.status(400).json({
          error: 'Order total mismatch',
          message: 'The order total does not match the sum of item prices'
        });
      }

      // Create order with enhanced data
      const orderData = {
        userId,
        items,
        address,
        phone,
        total,
        paymentMethod,
        specialInstructions,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes from now
      };

      const order = await Order.create(orderData);
      
      logger.info('Order placed successfully', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId,
        total,
        itemCount: items.length
      });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: {
          order: order.getSummary(),
          orderNumber: order.formattedOrderNumber,
          estimatedDelivery: order.estimatedDeliveryTime
        }
      });
    } catch (error) {
      logger.error('Error placing order:', {
        error: error.message,
        userId: req.user?.id,
        orderData: req.body
      });
      res.status(500).json({ 
        error: 'Failed to place order',
        message: 'Please try again later'
      });
    }
  }
);

// Get user orders with filtering and pagination
app.get('/api/orders/:userId', 
  orderLimiter,
  authenticateToken,
  validateRequest(orderQuerySchema, 'query'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, startDate, endDate, page, limit } = req.query;

      // Ensure user can only access their own orders (unless admin)
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        logger.warn('Unauthorized order access attempt', {
          requestedUserId: userId,
          actualUserId: req.user.id
        });
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own orders'
        });
      }

      // Build filter
      const filter = { userId };
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.created = {};
        if (startDate) filter.created.$gte = new Date(startDate);
        if (endDate) filter.created.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ created: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);
      
      logger.debug('Orders fetched successfully', {
        userId,
        total,
        page,
        limit,
        totalPages,
        filters: filter
      });

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            current: page,
            total: totalPages,
            limit,
            totalItems: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching user orders:', {
        error: error.message,
        userId: req.params.userId,
        query: req.query
      });
      res.status(500).json({ 
        error: 'Failed to fetch orders',
        message: 'Please try again later'
      });
    }
  }
);

// Get single order details
app.get('/api/orders/:userId/:orderId',
  orderLimiter,
  authenticateToken,
  async (req, res) => {
    try {
      const { userId, orderId } = req.params;

      // Ensure user can only access their own orders (unless admin)
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        logger.warn('Unauthorized order access attempt', {
          requestedUserId: userId,
          actualUserId: req.user.id,
          orderId
        });
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own orders'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({
          error: 'Invalid order ID',
          message: 'Please provide a valid order ID'
        });
      }

      const order = await Order.findOne({ _id: orderId, userId });
      
      if (!order) {
        logger.warn('Order not found', { orderId, userId });
        return res.status(404).json({
          error: 'Order not found',
          message: 'The requested order does not exist'
        });
      }

      logger.debug('Order details fetched successfully', {
        orderId,
        userId,
        orderNumber: order.orderNumber
      });

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('Error fetching order details:', {
        error: error.message,
        userId: req.params.userId,
        orderId: req.params.orderId
      });
      res.status(500).json({ 
        error: 'Failed to fetch order details',
        message: 'Please try again later'
      });
    }
  }
);

// Admin: get all orders with filtering and pagination
app.get('/api/orders', 
  adminLimiter,
  authenticateToken,
  requireAdmin,
  validateRequest(orderQuerySchema, 'query'),
  async (req, res) => {
    try {
      const { status, startDate, endDate, page, limit } = req.query;

      // Build filter
      const filter = {};
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.created = {};
        if (startDate) filter.created.$gte = new Date(startDate);
        if (endDate) filter.created.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ created: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);
      
      logger.info('Admin orders fetched successfully', {
        adminId: req.user.id,
        total,
        page,
        limit,
        totalPages,
        filters: filter
      });

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            current: page,
            total: totalPages,
            limit,
            totalItems: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching all orders:', {
        error: error.message,
        adminId: req.user?.id,
        query: req.query
      });
      res.status(500).json({ 
        error: 'Failed to fetch orders',
        message: 'Please try again later'
      });
    }
  }
);

// Admin: update order status
app.put('/api/orders/:id', 
  adminLimiter,
  authenticateToken,
  requireAdmin,
  validateRequest(orderStatusUpdateSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, estimatedDeliveryTime, notes } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: 'Invalid order ID',
          message: 'Please provide a valid order ID'
        });
      }

      const updateData = { 
        status,
        updatedAt: new Date()
      };
      
      if (estimatedDeliveryTime) {
        updateData.estimatedDeliveryTime = estimatedDeliveryTime;
      }
      
      if (status === 'Delivered') {
        updateData.actualDeliveryTime = new Date();
        updateData.paymentStatus = 'Paid'; // Mark as paid when delivered
      }

      const order = await Order.findByIdAndUpdate(
        id, 
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!order) {
        logger.warn('Order update failed: Order not found', {
          orderId: id,
          adminId: req.user.id
        });
        return res.status(404).json({
          error: 'Order not found',
          message: 'The requested order does not exist'
        });
      }

      // Add status update to history
      if (notes) {
        order.statusHistory.push({
          status,
          timestamp: new Date(),
          notes,
          updatedBy: req.user.id
        });
        await order.save();
      }
      
      logger.info('Order status updated successfully', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        newStatus: status,
        adminId: req.user.id
      });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      logger.error('Error updating order status:', {
        error: error.message,
        orderId: req.params.id,
        adminId: req.user?.id,
        updateData: req.body
      });
      res.status(500).json({ 
        error: 'Failed to update order',
        message: 'Please try again later'
      });
    }
  }
);

// Admin: Get order statistics
app.get('/api/orders/stats/summary',
  adminLimiter,
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        todayOrders,
        weekOrders,
        monthOrders,
        totalOrders,
        statusBreakdown,
        revenueToday,
        revenueWeek,
        revenueMonth
      ] = await Promise.all([
        Order.countDocuments({ created: { $gte: startOfDay } }),
        Order.countDocuments({ created: { $gte: startOfWeek } }),
        Order.countDocuments({ created: { $gte: startOfMonth } }),
        Order.countDocuments(),
        Order.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { created: { $gte: startOfDay }, status: { $ne: 'Cancelled' } } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        Order.aggregate([
          { $match: { created: { $gte: startOfWeek }, status: { $ne: 'Cancelled' } } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        Order.aggregate([
          { $match: { created: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
      ]);

      const stats = {
        orders: {
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
          total: totalOrders
        },
        revenue: {
          today: revenueToday[0]?.total || 0,
          week: revenueWeek[0]?.total || 0,
          month: revenueMonth[0]?.total || 0
        },
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };

      logger.info('Order statistics fetched', {
        adminId: req.user.id,
        stats
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching order statistics:', {
        error: error.message,
        adminId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to fetch statistics',
        message: 'Please try again later'
      });
    }
  }
);

// Apply error handling middleware
app.use(errorHandler);

app.listen(5002, () => {
  logger.info('Order Service started successfully on port 5002');
});