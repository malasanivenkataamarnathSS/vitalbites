const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name must not exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [500, 'Description must not exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Price must be greater than 0'
    }
  },
  image: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty strings
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image must be a valid URL'
    }
  },
  restaurant: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    minlength: [2, 'Restaurant name must be at least 2 characters long'],
    maxlength: [100, 'Restaurant name must not exceed 100 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['appetizer', 'main-course', 'dessert', 'beverage', 'snacks', 'pizza', 'burger', 'indian', 'chinese', 'italian', 'other'],
      message: 'Category must be one of: appetizer, main-course, dessert, beverage, snacks, pizza, burger, indian, chinese, italian, other'
    },
    default: 'other'
  },
  available: { 
    type: Boolean, 
    default: true 
  },
  preparationTime: {
    type: Number,
    min: [5, 'Preparation time must be at least 5 minutes'],
    max: [120, 'Preparation time must not exceed 120 minutes']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag must not exceed 20 characters']
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
MenuItemSchema.index({ restaurant: 1, category: 1 });
MenuItemSchema.index({ name: 'text', description: 'text', restaurant: 'text' });
MenuItemSchema.index({ price: 1 });
MenuItemSchema.index({ available: 1 });

// Compound index for unique constraint
MenuItemSchema.index({ name: 1, restaurant: 1 }, { unique: true });

// Pre-save middleware to validate tags array length
MenuItemSchema.pre('save', function(next) {
  if (this.tags && this.tags.length > 5) {
    next(new Error('Maximum 5 tags allowed'));
  } else {
    next();
  }
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);