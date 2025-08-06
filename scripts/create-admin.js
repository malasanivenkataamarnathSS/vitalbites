const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  mobile: { type: String, sparse: true },
  otp: String,
  otpExpires: Date,
  lastOtpSent: Date,
  gender: { type: String, enum: ["male", "female", "other", null], default: null },
  dateOfBirth: { type: Date, default: null },
  role: { type: String, enum: ["user", "admin"], default: "user" },
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

const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/authdb', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@vitalbites.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Updated existing user to admin role');
    } else {
      // Create new admin user
      const adminUser = new User({
        username: 'Admin User',
        email: 'admin@vitalbites.com',
        mobile: '+919876543210',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Created admin user: admin@vitalbites.com');
    }
    
    console.log('Admin setup complete!');
    console.log('To login as admin:');
    console.log('1. Use email: admin@vitalbites.com');
    console.log('2. Send OTP from the admin panel');
    console.log('3. Check the server logs for the OTP (it will be printed)');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminUser();