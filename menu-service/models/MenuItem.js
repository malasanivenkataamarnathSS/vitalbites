const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  restaurant: String,
  available: { type: Boolean, default: true }
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);