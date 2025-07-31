const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  mobile: String,
  otp: String,
  otpExpires: Date,
  lastOtpSent: Date, // <-- Add this line
  role: { type: String, enum: ["user", "admin"], default: "user" }
});

module.exports = mongoose.model('User', UserSchema);