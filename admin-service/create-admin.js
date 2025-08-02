require('dotenv').config();
const mongoose = require('mongoose');

// Connect to auth database
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/authdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User model
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: String,
  mobile: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  otp: String,
  otpExpires: Date,
  lastOtpSent: Date,
  createdAt: { type: Date, default: Date.now }
}));

async function createAdminUser() {
  try {
    const adminEmail = 'admin@vitalbites.com';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      
      // Update to admin role if needed
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log('Updated existing user to admin role');
      }
    } else {
      // Create new admin user
      const adminUser = new User({
        email: adminEmail,
        username: 'Admin',
        mobile: '+919999999999',
        role: 'admin',
        isActive: true
      });
      
      await adminUser.save();
      console.log('Created new admin user:', adminUser.email);
    }
    
    console.log('Admin user setup complete!');
    console.log('Email: admin@vitalbites.com');
    console.log('Note: Use OTP login flow to authenticate as admin');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();