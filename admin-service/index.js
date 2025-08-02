require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://vitalbites.com'] 
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin - we'll connect to auth service database
    const authDB = mongoose.connection.useDb('authdb');
    const User = authDB.model('User', new mongoose.Schema({
      email: String,
      role: String,
      isActive: Boolean
    }));
    
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin' || !user.isActive) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Database connections
const connectToDatabase = async (dbName) => {
  try {
    const connection = mongoose.createConnection(process.env.MONGO_URL.replace(/\/[^\/]*$/, `/${dbName}`), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`Connected to ${dbName}`);
    return connection;
  } catch (error) {
    console.error(`Error connecting to ${dbName}:`, error);
    throw error;
  }
};

// Initialize database connections
let authDB, userDB, orderDB, menuDB, cartDB;

const initializeDatabases = async () => {
  try {
    authDB = await connectToDatabase('authdb');
    userDB = await connectToDatabase('userdb');
    orderDB = await connectToDatabase('orderdb');
    menuDB = await connectToDatabase('menudb');
    cartDB = await connectToDatabase('cartdb');
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    process.exit(1);
  }
};

// Models
const getUserModel = () => authDB.model('User', new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}));

const getOrderModel = () => orderDB.model('Order', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userEmail: String,
  items: [{ name: String, price: Number, quantity: Number }],
  total: Number,
  status: { type: String, default: 'processing' },
  deliveryAddress: String,
  createdAt: { type: Date, default: Date.now }
}));

const getMenuModel = () => menuDB.model('MenuItem', new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}));

const getUserProfileModel = () => userDB.model('UserProfile', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  email: String,
  addresses: [{
    label: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: Boolean
  }]
}));

// Dashboard Analytics API
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const User = getUserModel();
    const Order = getOrderModel();
    
    const [totalUsers, activeUsers, totalOrders, deliveredOrders, recentOrders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'delivered' }),
      Order.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);

    res.json({
      analytics: {
        totalUsers,
        activeUsers,
        totalOrders,
        deliveredOrders
      },
      recentOrders: recentOrders.map(order => ({
        id: order._id,
        userEmail: order.userEmail,
        status: order.status,
        total: order.total,
        date: order.createdAt.toISOString().split('T')[0]
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users Management APIs
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const User = getUserModel();
    const users = await User.find().sort({ createdAt: -1 }).lean();
    
    res.json(users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      createdAt: user.createdAt
    })));
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const User = getUserModel();
    const { name, role, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, isActive },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Orders Management APIs
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const Order = getOrderModel();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    
    res.json(orders.map(order => ({
      id: order._id,
      userEmail: order.userEmail,
      status: order.status,
      total: order.total,
      items: order.items,
      deliveryAddress: order.deliveryAddress,
      date: order.createdAt.toISOString().split('T')[0]
    })));
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const Order = getOrderModel();
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Menu Management APIs
app.get('/api/admin/menu', authenticateAdmin, async (req, res) => {
  try {
    const MenuItem = getMenuModel();
    const menuItems = await MenuItem.find().sort({ createdAt: -1 }).lean();
    
    res.json(menuItems.map(item => ({
      id: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      available: item.available
    })));
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/menu', authenticateAdmin, async (req, res) => {
  try {
    const MenuItem = getMenuModel();
    const { name, description, price, image, category, available } = req.body;
    
    const menuItem = new MenuItem({
      name,
      description,
      price,
      image,
      category,
      available
    });
    
    await menuItem.save();
    res.json({ message: 'Menu item created successfully', menuItem });
  } catch (error) {
    console.error('Menu create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/menu/:id', authenticateAdmin, async (req, res) => {
  try {
    const MenuItem = getMenuModel();
    const { name, description, price, image, category, available } = req.body;
    
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, description, price, image, category, available },
      { new: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    res.json({ message: 'Menu item updated successfully', menuItem });
  } catch (error) {
    console.error('Menu update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/menu/:id', authenticateAdmin, async (req, res) => {
  try {
    const MenuItem = getMenuModel();
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Menu delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Addresses Management API
app.get('/api/admin/addresses', authenticateAdmin, async (req, res) => {
  try {
    const UserProfile = getUserProfileModel();
    const profiles = await UserProfile.find({ addresses: { $exists: true, $ne: [] } }).lean();
    
    const addresses = [];
    profiles.forEach(profile => {
      profile.addresses.forEach(address => {
        addresses.push({
          id: address._id,
          userEmail: profile.email,
          label: address.label,
          address: `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
          isDefault: address.isDefault
        });
      });
    });
    
    res.json(addresses);
  } catch (error) {
    console.error('Addresses fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'admin-service' });
});

// Initialize and start server
const PORT = process.env.PORT || 3007;

initializeDatabases().then(() => {
  app.listen(PORT, () => {
    console.log(`Admin service running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start admin service:', error);
  process.exit(1);
});