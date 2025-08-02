const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  mobile: String,
  otp: String,
  otpExpires: Date,
  lastOtpSent: Date,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  // Multiple addresses support
  addresses: [{
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    deliveryInstructions: String,
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);