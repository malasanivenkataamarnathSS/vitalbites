const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    // Connect to different databases to get stats
    const connections = {
      users: mongoose.createConnection(process.env.MONGO_URL.replace('/admindb', '/userdb')),
      orders: mongoose.createConnection(process.env.MONGO_URL.replace('/admindb', '/orderdb')),
      menu: mongoose.createConnection(process.env.MONGO_URL.replace('/admindb', '/menudb')),
      cart: mongoose.createConnection(process.env.MONGO_URL.replace('/admindb', '/cartdb'))
    };

    // Get current date ranges
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Aggregate stats in parallel
    const [
      totalUsers,
      newUsersToday,
      totalOrders,
      ordersToday,
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      activeMenuItems,
      activeCarts
    ] = await Promise.all([
      // Users stats
      connections.users.collection('users').countDocuments(),
      connections.users.collection('users').countDocuments({
        createdAt: { $gte: startOfDay }
      }),
      
      // Orders stats
      connections.orders.collection('orders').countDocuments(),
      connections.orders.collection('orders').countDocuments({
        createdAt: { $gte: startOfDay }
      }),
      
      // Revenue stats
      connections.orders.collection('orders').aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).toArray().then(result => result[0]?.total || 0),
      
      connections.orders.collection('orders').aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startOfDay }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).toArray().then(result => result[0]?.total || 0),
      
      connections.orders.collection('orders').aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).toArray().then(result => result[0]?.total || 0),
      
      // Menu stats
      connections.menu.collection('menuitems').countDocuments({ active: true }),
      
      // Cart stats
      connections.cart.collection('carts').countDocuments({ 'items.0': { $exists: true } })
    ]);

    // Get order status distribution
    const orderStatusDistribution = await connections.orders.collection('orders').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get top selling items (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const topSellingItems = await connections.orders.collection('orders').aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]).toArray();

    // Get recent orders
    const recentOrders = await connections.orders.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Close connections
    Object.values(connections).forEach(conn => conn.close());

    const dashboardData = {
      stats: {
        users: {
          total: totalUsers,
          today: newUsersToday,
          growth: totalUsers > 0 ? ((newUsersToday / totalUsers) * 100).toFixed(1) : 0
        },
        orders: {
          total: totalOrders,
          today: ordersToday,
          growth: totalOrders > 0 ? ((ordersToday / totalOrders) * 100).toFixed(1) : 0
        },
        revenue: {
          total: totalRevenue,
          today: revenueToday,
          thisMonth: revenueThisMonth,
          growth: totalRevenue > 0 ? ((revenueToday / totalRevenue) * 100).toFixed(1) : 0
        },
        menu: {
          activeItems: activeMenuItems
        },
        carts: {
          active: activeCarts
        }
      },
      orderStatusDistribution,
      topSellingItems,
      recentOrders: recentOrders.slice(0, 5),
      systemHealth: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Get real-time metrics
router.get('/metrics', async (req, res) => {
  try {
    const connections = {
      orders: mongoose.createConnection(process.env.MONGO_URL.replace('/admindb', '/orderdb'))
    };

    // Get orders from last 24 hours by hour
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const hourlyOrders = await connections.orders.collection('orders').aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ]).toArray();

    connections.orders.close();

    res.json({
      success: true,
      data: {
        hourlyOrders,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

module.exports = router;