require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const MenuItem = require('./models/MenuItem');
const adminAuth = require('./middleware/adminAuth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Menu DB connected'));

// Get all menu items
app.get('/api/menu', async (req, res) => {
  const items = await MenuItem.find();
  res.json(items);
});

// Add menu item (admin)
app.post('/api/menu', adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    console.log(`Admin ${req.user.id} added menu item: ${item.name}`);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update menu item (admin)
app.put('/api/menu/:id', adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    console.log(`Admin ${req.user.id} updated menu item: ${item.name}`);
    res.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete menu item (admin)
app.delete('/api/menu/:id', adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    console.log(`Admin ${req.user.id} deleted menu item: ${item.name}`);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get menu statistics
app.get('/api/menu/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalItems = await MenuItem.countDocuments();
    const availableItems = await MenuItem.countDocuments({ available: true });
    const unavailableItems = await MenuItem.countDocuments({ available: false });
    
    res.json({
      totalItems,
      availableItems,
      unavailableItems,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching menu stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(5001, () => console.log('Menu Service on 5001'));