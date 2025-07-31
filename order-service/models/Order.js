const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: String,
  items: [
    {
      menuItemId: String,
      name: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ],
  address: String,
  phone: String,
  status: { type: String, default: 'Processing' },
  total: Number,
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);