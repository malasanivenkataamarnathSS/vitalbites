require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Auth DB connected'));

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Nodemailer setup (Gmail SMTP with app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL, // your gmail
    pass: process.env.SMTP_PASS   // your app password
  }
});

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  console.log('Received OTP request:', req.body);
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, otp, otpExpires });
    return res.json({ newUser: true, message: "OTP sent. Please provide username on verification." });
  } else {
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
  }

  // Send email
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Your VitalBites OTP',
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`
  }, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Email sent:', info.response);
    }
  });

  res.json({ message: "OTP sent" });
});

// Verify OTP & Register/Login
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp, username } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Missing fields" });

  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpires < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // If new user, require username
  if (!user.username) {
    if (!username) return res.json({ needUsername: true, message: "Username required for registration" });
    user.username = username;
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, userId: user._id, username: user.username, role: user.role });
});

// Verify JWT
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(5000, () => console.log('Auth Service on 5000'));