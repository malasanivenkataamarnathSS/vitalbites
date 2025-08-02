const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [{
    menuItemId: {
      type: String,
      required: [true, 'Menu item ID is required']
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters long'],
      maxlength: [100, 'Item name must not exceed 100 characters']
    },
    price: {
      type: Number,
      required: [true, 'Item price is required'],
      min: [0, 'Item price must be positive']
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [50, 'Quantity cannot exceed 50 per item']
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
      trim: true,
      maxlength: [100, 'Restaurant name must not exceed 100 characters']
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  address: {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name must not exceed 100 characters']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      validate: {
        validator: function(v) {
          return /^\+91[6-9]\d{9}$/.test(v);
        },
        message: 'Mobile number must be in format +91XXXXXXXXXX and start with 6-9'
      }
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      minlength: [5, 'Street address must be at least 5 characters long'],
      maxlength: [200, 'Street address must not exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      minlength: [2, 'City must be at least 2 characters long'],
      maxlength: [50, 'City must not exceed 50 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      minlength: [2, 'State must be at least 2 characters long'],
      maxlength: [50, 'State must not exceed 50 characters']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      validate: {
        validator: function(v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: 'Pincode must be a valid 6-digit Indian postal code'
      }
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: [300, 'Delivery instructions must not exceed 300 characters']
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\+91[6-9]\d{9}$/.test(v);
      },
      message: 'Phone number must be in format +91XXXXXXXXXX and start with 6-9'
    }
  },
  status: { 
    type: String, 
    enum: {
      values: ['Pending', 'Processing', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      message: 'Status must be one of: Pending, Processing, Confirmed, Preparing, Out for Delivery, Delivered, Cancelled'
    },
    default: 'Pending',
    index: true
  },
  total: {
    type: Number,
    required: [true, 'Order total is required'],
    min: [0, 'Order total must be positive']
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'upi', 'wallet'],
      message: 'Payment method must be one of: cash, card, upi, wallet'
    },
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['Pending', 'Paid', 'Failed', 'Refunded'],
      message: 'Payment status must be one of: Pending, Paid, Failed, Refunded'
    },
    default: 'Pending'
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Special instructions must not exceed 500 characters']
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [300, 'Status notes must not exceed 300 characters']
    },
    updatedBy: {
      type: String // Admin user ID who updated the status
    }
  }],
  created: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for better performance
OrderSchema.index({ userId: 1, created: -1 });
OrderSchema.index({ status: 1, created: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ 'address.pincode': 1 });

// Pre-save middleware to generate order number and calculate subtotals
OrderSchema.pre('save', function(next) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    this.orderNumber = `VB${dateStr}${timeStr}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  // Calculate subtotals for items
  this.items.forEach(item => {
    item.subtotal = item.price * item.quantity;
  });

  // Add to status history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`
    });
  }

  next();
});

// Virtual for formatted order number
OrderSchema.virtual('formattedOrderNumber').get(function() {
  if (!this.orderNumber) return '';
  return this.orderNumber.replace(/^VB/, 'VB-');
});

// Method to calculate delivery fee (can be customized based on business logic)
OrderSchema.methods.calculateDeliveryFee = function() {
  const baseDeliveryFee = 30;
  const freeDeliveryThreshold = 200;
  
  if (this.total >= freeDeliveryThreshold) {
    return 0;
  }
  
  return baseDeliveryFee;
};

// Method to get order summary
OrderSchema.methods.getSummary = function() {
  return {
    orderNumber: this.formattedOrderNumber,
    itemCount: this.items.length,
    totalQuantity: this.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: this.total,
    deliveryFee: this.calculateDeliveryFee(),
    grandTotal: this.total + this.calculateDeliveryFee(),
    status: this.status,
    estimatedDelivery: this.estimatedDeliveryTime
  };
};

module.exports = mongoose.model('Order', OrderSchema);