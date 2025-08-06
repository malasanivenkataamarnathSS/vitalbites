require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Order = require('./models/Order');
const adminAuth = require('./middleware/adminAuth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Order DB connected'));

// Place order
app.post('/api/orders', async (req, res) => {
  const { userId, items, address, phone, total } = req.body;
  const order = await Order.create({ userId, items, address, phone, total });
  res.status(201).json(order);
});

// Get user orders
app.get('/api/orders/:userId', async (req, res) => {
  const orders = await Order.find({ userId: req.params.userId });
  res.json(orders);
});

// Admin: get all orders with enhanced filtering
app.get('/api/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 50, sort = '-created' } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: skip + orders.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update order status
app.put('/api/orders/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Processing', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`Admin ${req.user.id} updated order ${order._id} status to ${status}`);
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: get order statistics
app.get('/api/orders/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    
    // Calculate total revenue from delivered orders
    const revenueResult = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ created: -1 })
      .limit(5)
      .select('_id userId status total created');
    
    res.json({
      totalOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      recentOrders,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete order
app.delete('/api/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`Admin ${req.user.id} deleted order ${order._id}`);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(5002, () => console.log('Order Service on 5002'));