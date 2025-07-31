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

// Send or Resend OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  let user = await User.findOne({ email });
  const now = new Date();

  // Resend logic: allow resend only after 30s
  if (user && user.lastOtpSent && now - user.lastOtpSent < 30 * 1000) {
    const wait = 30 - Math.floor((now - user.lastOtpSent) / 1000);
    return res.status(429).json({ error: `Please wait ${wait}s before resending OTP.` });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(now.getTime() + 10 * 60 * 1000); // 10 min

  if (!user) {
    user = await User.create({ email, otp, otpExpires, lastOtpSent: now });
  } else {
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.lastOtpSent = now;
    await user.save();
  }

  // Send OTP email
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Your VitalBites Login OTP',
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;border:1px solid #eee;">
        <h2 style="color:#ff8800;text-align:center;margin-bottom:16px;">VitalBites Login Verification</h2>
        <p style="font-size:16px;color:#222;text-align:center;">Hello,</p>
        <p style="font-size:16px;color:#222;text-align:center;">
          Use the following <b style="font-size:22px;letter-spacing:2px;color:#ff8800;">OTP</b> to log in to your VitalBites account:
        </p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#ff8800;text-align:center;margin:24px 0;">
          ${otp}
        </div>
        <p style="font-size:15px;color:#444;text-align:center;">
          This OTP is valid for <b>10 minutes</b>.<br>
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="margin:24px 0;">
        <p style="font-size:13px;color:#888;text-align:center;">Thank you for using VitalBites!</p>
      </div>
    `
  }, (err, info) => {
    if (err) {
      console.error(`[OTP] Failed to send email to ${email}:`, err);
    } else {
      console.log(`[OTP] Email sent to ${email}:`, info.response);
    }
  });

  res.json({ message: "OTP sent" });
});

// OTP Verification
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Missing fields" });

  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpires < new Date()) {
    console.log(`OTP verification failed for: ${email}`);
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // New user: prompt for details
  if (!user.username || !user.mobile) {
    console.log(`New user detected: ${email}. Prompting for additional details.`);
    return res.json({ needDetails: true, message: "Username and mobile required for registration" });
  }

  // Existing user: login
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  console.log(`Existing user login: ${email}. Redirecting to homepage.`);
  res.json({ token, userId: user._id, username: user.username, role: user.role });
});

// Complete registration for new user
app.post('/api/auth/complete-registration', async (req, res) => {
  const { email, username, mobile } = req.body;
  if (!email || !username || !mobile) return res.status(400).json({ error: "Missing fields" });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  user.username = username;
  user.mobile = mobile;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  console.log(`User created: ${email}, Name: ${username}, Mobile: ${mobile}. Redirecting to homepage.`);
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

