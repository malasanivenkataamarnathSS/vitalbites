const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: String,
  name: String,
  email: String,
  phone: String,
  addresses: [String]
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);