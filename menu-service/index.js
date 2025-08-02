require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import enhanced middleware and utilities
const { 
  menuLimiter, 
  adminLimiter, 
  securityHeaders, 
  requestLogger, 
  errorHandler, 
  validateRequest 
} = require('./middleware/security');
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const logger = require('./utils/logger');
const {
  menuItemSchema,
  menuItemUpdateSchema,
  menuQuerySchema
} = require('./validators/menuValidators');

const MenuItem = require('./models/MenuItem');

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
  logger.info('Menu DB connected successfully');
})
.catch((error) => {
  logger.error('Database connection failed:', error);
  process.exit(1);
});

// Get all menu items with filtering, search, and pagination
app.get('/api/menu', 
  menuLimiter,
  validateRequest(menuQuerySchema, 'query'),
  async (req, res) => {
    try {
      const { 
        category, 
        restaurant, 
        available, 
        minPrice, 
        maxPrice, 
        search, 
        page, 
        limit 
      } = req.query;

      // Build filter object
      const filter = {};
      
      if (category) filter.category = category;
      if (restaurant) filter.restaurant = new RegExp(restaurant, 'i');
      if (available !== undefined) filter.available = available;
      
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
      
      if (search) {
        filter.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { restaurant: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute query with pagination
      const [items, total] = await Promise.all([
        MenuItem.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        MenuItem.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);
      
      logger.info('Menu items fetched successfully', {
        total,
        page,
        limit,
        totalPages,
        filters: filter
      });

      res.json({
        success: true,
        data: {
          items,
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
      logger.error('Error fetching menu items:', {
        error: error.message,
        query: req.query
      });
      res.status(500).json({ 
        error: 'Failed to fetch menu items',
        message: 'Please try again later'
      });
    }
  }
);

// Add menu item (admin only)
app.post('/api/menu', 
  adminLimiter,
  authenticateToken,
  requireAdmin,
  validateRequest(menuItemSchema),
  async (req, res) => {
    try {
      const menuItemData = req.body;
      
      // Check if item with same name exists for same restaurant
      const existingItem = await MenuItem.findOne({
        name: menuItemData.name,
        restaurant: menuItemData.restaurant
      });
      
      if (existingItem) {
        logger.warn('Menu item creation failed: Duplicate item', {
          name: menuItemData.name,
          restaurant: menuItemData.restaurant,
          adminId: req.user.id
        });
        return res.status(400).json({
          error: 'Duplicate menu item',
          message: 'An item with this name already exists for this restaurant'
        });
      }

      const item = await MenuItem.create({
        ...menuItemData,
        createdBy: req.user.id
      });
      
      logger.info('Menu item created successfully', {
        itemId: item._id,
        name: item.name,
        restaurant: item.restaurant,
        adminId: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: item
      });
    } catch (error) {
      logger.error('Error creating menu item:', {
        error: error.message,
        adminId: req.user?.id,
        itemData: req.body
      });
      res.status(500).json({ 
        error: 'Failed to create menu item',
        message: 'Please try again later'
      });
    }
  }
);

// Update menu item (admin only)
app.put('/api/menu/:id', 
  adminLimiter,
  authenticateToken,
  requireAdmin,
  validateRequest(menuItemUpdateSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: 'Invalid ID',
          message: 'Please provide a valid menu item ID'
        });
      }

      const item = await MenuItem.findByIdAndUpdate(
        id, 
        { ...updateData, updatedBy: req.user.id, updatedAt: new Date() }, 
        { new: true, runValidators: true }
      );
      
      if (!item) {
        logger.warn('Menu item update failed: Item not found', {
          itemId: id,
          adminId: req.user.id
        });
        return res.status(404).json({
          error: 'Menu item not found',
          message: 'The requested menu item does not exist'
        });
      }
      
      logger.info('Menu item updated successfully', {
        itemId: item._id,
        name: item.name,
        adminId: req.user.id,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Menu item updated successfully',
        data: item
      });
    } catch (error) {
      logger.error('Error updating menu item:', {
        error: error.message,
        itemId: req.params.id,
        adminId: req.user?.id,
        updateData: req.body
      });
      res.status(500).json({ 
        error: 'Failed to update menu item',
        message: 'Please try again later'
      });
    }
  }
);

// Delete menu item (admin only)
app.delete('/api/menu/:id', 
  adminLimiter,
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: 'Invalid ID',
          message: 'Please provide a valid menu item ID'
        });
      }

      const item = await MenuItem.findByIdAndDelete(id);
      
      if (!item) {
        logger.warn('Menu item deletion failed: Item not found', {
          itemId: id,
          adminId: req.user.id
        });
        return res.status(404).json({
          error: 'Menu item not found',
          message: 'The requested menu item does not exist'
        });
      }
      
      logger.info('Menu item deleted successfully', {
        itemId: item._id,
        name: item.name,
        adminId: req.user.id
      });

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting menu item:', {
        error: error.message,
        itemId: req.params.id,
        adminId: req.user?.id
      });
      res.status(500).json({ 
        error: 'Failed to delete menu item',
        message: 'Please try again later'
      });
    }
  }
);

// Get menu categories
app.get('/api/menu/categories', menuLimiter, async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    
    logger.debug('Menu categories fetched successfully', {
      categoriesCount: categories.length
    });

    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    logger.error('Error fetching menu categories:', {
      error: error.message
    });
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      message: 'Please try again later'
    });
  }
});

// Get restaurants
app.get('/api/menu/restaurants', menuLimiter, async (req, res) => {
  try {
    const restaurants = await MenuItem.distinct('restaurant');
    
    logger.debug('Restaurants fetched successfully', {
      restaurantsCount: restaurants.length
    });

    res.json({
      success: true,
      data: restaurants.sort()
    });
  } catch (error) {
    logger.error('Error fetching restaurants:', {
      error: error.message
    });
    res.status(500).json({ 
      error: 'Failed to fetch restaurants',
      message: 'Please try again later'
    });
  }
});

// Apply error handling middleware
app.use(errorHandler);

app.listen(5001, () => {
  logger.info('Menu Service started successfully on port 5001');
});