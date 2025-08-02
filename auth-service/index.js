require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');

// Import enhanced middleware and utilities
const { 
  otpLimiter, 
  authLimiter, 
  securityHeaders, 
  requestLogger, 
  errorHandler, 
  validateRequest 
} = require('./middleware/security');
const { authenticateToken } = require('./middleware/auth');
const logger = require('./utils/logger');
const {
  emailSchema,
  otpVerificationSchema,
  registrationSchema,
  profileUpdateSchema,
  addressSchema
} = require('./validators/authValidators');

const User = require('./models/User');

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://vitalbites.com'] // Replace with actual domain
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Database connection with better error handling
mongoose.connect(process.env.MONGO_URL, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  logger.info('Auth DB connected successfully');
})
.catch((error) => {
  logger.error('Database connection failed:', error);
  process.exit(1);
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Nodemailer setup with validation
if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
  logger.warn('SMTP credentials not configured');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

// Send or Resend OTP
app.post('/api/auth/send-otp', 
  otpLimiter, 
  validateRequest(emailSchema), 
  async (req, res) => {
    try {
      const { email } = req.body;
      
      let user = await User.findOne({ email });
      const now = new Date();

      // Resend logic: allow resend only after 30s
      if (user && user.lastOtpSent && now - user.lastOtpSent < 30 * 1000) {
        const wait = 30 - Math.floor((now - user.lastOtpSent) / 1000);
        logger.warn('OTP resend attempted too soon', { email, waitTime: wait });
        return res.status(429).json({ 
          error: `Please wait ${wait}s before resending OTP.`,
          retryAfter: wait
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(now.getTime() + 10 * 60 * 1000); // 10 min

      logger.info('OTP generated for user', { email, otpLength: otp.length });

      if (!user) {
        user = await User.create({ email, otp, otpExpires, lastOtpSent: now });
        logger.info('New user created for OTP', { email });
      } else {
        user.otp = otp;
        user.otpExpires = otpExpires;
        user.lastOtpSent = now;
        await user.save();
        logger.info('OTP updated for existing user', { email });
      }

      // Send OTP email
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASS) {
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
        });
        logger.info('OTP email sent successfully', { email });
      } else {
        logger.warn('SMTP not configured - OTP not sent via email', { email, otp });
      }

      res.json({ 
        message: "OTP sent successfully",
        email: email
      });
    } catch (error) {
      logger.error('Error in send-otp endpoint:', {
        error: error.message,
        email: req.body.email
      });
      res.status(500).json({ 
        error: 'Failed to send OTP',
        message: 'Please try again later'
      });
    }
  }
);

// OTP Verification
app.post('/api/auth/verify-otp', 
  authLimiter,
  validateRequest(otpVerificationSchema),
  async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn('OTP verification failed: User not found', { email });
        return res.status(400).json({ 
          error: "Invalid credentials",
          message: "Please request a new OTP"
        });
      }

      if (!user.otp || user.otp !== otp || user.otpExpires < new Date()) {
        logger.warn('OTP verification failed: Invalid or expired OTP', { 
          email, 
          hasOtp: !!user.otp,
          expired: user.otpExpires < new Date()
        });
        return res.status(400).json({ 
          error: "Invalid or expired OTP",
          message: "Please request a new OTP"
        });
      }

      logger.info('OTP verified successfully', { email });

      // Check if user is new (no username or mobile)
      if (!user.username || !user.mobile) {
        logger.info('New user detected - registration required', { email });
        return res.json({
          needDetails: true,
          isNewUser: true,
          message: "Please complete your registration",
          email: email
        });
      }

      // Existing user: login directly
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );
      
      logger.info('User logged in successfully', { 
        email, 
        userId: user._id, 
        role: user.role 
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          mobile: user.mobile,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Error in verify-otp endpoint:', {
        error: error.message,
        email: req.body.email
      });
      res.status(500).json({ 
        error: 'Verification failed',
        message: 'Please try again later'
      });
    }
  }
);

// Complete registration for new user
app.post('/api/auth/complete-registration', 
  authLimiter,
  validateRequest(registrationSchema),
  async (req, res) => {
    try {
      const { email, username, mobile } = req.body;

      // Check if mobile is already used by another user
      const existingMobile = await User.findOne({ 
        mobile: mobile,
        email: { $ne: email } // Not the current user
      });
      
      if (existingMobile) {
        logger.warn('Registration failed: Mobile number already exists', { 
          email, 
          mobile,
          existingUserEmail: existingMobile.email 
        });
        return res.status(400).json({ 
          error: "Mobile number already registered",
          message: "This mobile number is already registered with another account" 
        });
      }
      
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn('Registration failed: User not found', { email });
        return res.status(400).json({ 
          error: "User not found",
          message: "Please start the registration process again"
        });
      }

      const wasNewUser = !user.username || !user.mobile;

      user.username = username.trim();
      user.mobile = mobile;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      logger.info('User registration completed successfully', { 
        email, 
        username: username.trim(), 
        mobile,
        wasNewUser
      });

      res.json({
        success: true,
        message: "Registration completed successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          mobile: user.mobile,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Error in complete-registration endpoint:', {
        error: error.message,
        email: req.body.email
      });
      res.status(500).json({ 
        error: 'Registration failed',
        message: 'Please try again later'
      });
    }
  }
);

// Verify JWT
app.get('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn('JWT verification failed: No token provided', { ip: req.ip });
      return res.status(401).json({ 
        error: "Authentication required",
        message: "No access token provided" 
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug('JWT verified successfully', { userId: decoded.id });
    
    res.json({ 
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    logger.warn('JWT verification failed', { 
      error: error.message, 
      ip: req.ip 
    });
    
    const message = error.name === 'TokenExpiredError' 
      ? 'Token has expired'
      : 'Invalid token';
      
    res.status(401).json({ 
      error: "Authentication failed",
      message 
    });
  }
});

// Debug endpoint to check user status (remove in production)
app.get('/api/auth/debug-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ exists: false, message: 'User not found' });
    }

    const now = new Date();
    const otpValid = user.otp && user.otpExpires && user.otpExpires > now;

    res.json({
      exists: true,
      email: user.email,
      hasUsername: !!user.username,
      hasMobile: !!user.mobile,
      currentOtp: user.otp,
      otpValid,
      otpExpires: user.otpExpires,
      needsDetails: !user.username || !user.mobile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ADDRESS MANAGEMENT ENDPOINTS =====

// Get all addresses for a user
app.get('/api/auth/addresses', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) {
      logger.warn('Address fetch failed: User not found', { userId: req.user.id });
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Unable to fetch addresses'
      });
    }
    
    logger.debug('Addresses fetched successfully', { 
      userId: req.user.id, 
      addressCount: user.addresses?.length || 0 
    });
    
    res.json({ 
      success: true,
      addresses: user.addresses || [] 
    });
  } catch (error) {
    logger.error('Error fetching addresses:', {
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ 
      error: 'Failed to fetch addresses',
      message: 'Please try again later'
    });
  }
});

// Add new address
app.post('/api/auth/addresses', 
  authenticateToken, 
  validateRequest(addressSchema),
  async (req, res) => {
    try {
      const { fullName, mobile, street, city, state, pincode, deliveryInstructions, isDefault } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        logger.warn('Add address failed: User not found', { userId: req.user.id });
        return res.status(404).json({ 
          error: 'User not found',
          message: 'Unable to add address'
        });
      }

      // If this is set as default, unset other defaults
      if (isDefault) {
        user.addresses.forEach(addr => addr.isDefault = false);
      }

      const newAddress = {
        fullName,
        mobile,
        street,
        city,
        state,
        pincode,
        deliveryInstructions,
        isDefault: isDefault || user.addresses.length === 0 // First address is default
      };

      user.addresses.push(newAddress);
      await user.save();

      const addedAddress = user.addresses[user.addresses.length - 1];
      
      logger.info('Address added successfully', {
        userId: req.user.id,
        addressId: addedAddress._id,
        isDefault: addedAddress.isDefault
      });

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        address: addedAddress
      });
    } catch (error) {
      logger.error('Error adding address:', {
        error: error.message,
        userId: req.user.id
      });
      res.status(500).json({ 
        error: 'Failed to add address',
        message: 'Please try again later'
      });
    }
  }
);

// Update address
app.put('/api/auth/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    Object.assign(address, updates);
    await user.save();

    res.json({ message: 'Address updated successfully', address });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete address
app.delete('/api/auth/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    // If deleted address was default, make first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set default address
app.put('/api/auth/addresses/:addressId/default', authenticateToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Unset all defaults
    user.addresses.forEach(addr => addr.isDefault = false);

    // Set new default
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    address.isDefault = true;
    await user.save();

    res.json({ message: 'Default address set successfully', address });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
app.put('/api/user/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get updated data
    const { username, gender, dateOfBirth } = req.body;
    
    // Find and update user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update fields - only name, gender and dateOfBirth can be changed
    user.username = username;
    
    // Only set gender if provided
    if (gender !== undefined) {
      user.gender = gender;
    }
    
    // Only set dateOfBirth if provided
    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth;
    }
    
    await user.save();
    
    res.json({ success: true, message: "Profile updated successfully" });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    
    // Verify token and find user (existing code)...
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Format mobile number without +91 prefix
    const mobileDisplay = user.mobile ? user.mobile.replace('+91', '') : null;
    
    // Format user data for frontend
    const userData = {
      name: user.username || null,
      email: user.email || null,
      mobile: mobileDisplay,  // Mobile without +91 prefix
      gender: user.gender || null,
      dateOfBirth: user.dateOfBirth || null,
      createdAt: user.createdAt || new Date()
    };
    
    console.log(`Sending profile data for user ${user.email}:`, userData);
    res.json(userData);
    
  } catch (error) {
    console.error('Error in profile endpoint:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Apply error handling middleware
app.use(errorHandler);

app.listen(5000, () => {
  logger.info('Auth Service started successfully on port 5000');
});

