const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function fixDuplicateMobiles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/authdb');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({}).sort({ createdAt: 1 });
    
    // Track mobile numbers we've seen
    const mobileNumbers = new Map();
    let duplicatesFound = 0;

    for (const user of users) {
      if (user.mobile) {
        if (mobileNumbers.has(user.mobile)) {
          duplicatesFound++;
          console.log(`Found duplicate mobile ${user.mobile} for user ${user.email}`);
          
          // Add random suffix to make unique
          const randomSuffix = Math.floor(Math.random() * 1000);
          const newMobile = `${user.mobile}_DUP${randomSuffix}`;
          
          // Update the user with the new mobile
          await User.updateOne({ _id: user._id }, { mobile: newMobile });
          console.log(`Updated ${user.email} mobile to ${newMobile}`);
        } else {
          mobileNumbers.set(user.mobile, user.email);
        }
      }
    }

    if (duplicatesFound === 0) {
      console.log('No duplicate mobile numbers found');
    } else {
      console.log(`Fixed ${duplicatesFound} duplicate mobile numbers`);
    }

    // Now that duplicates are fixed, create the unique index
    console.log('Creating unique index on mobile field...');
    await mongoose.connection.collections.users.createIndex({ mobile: 1 }, { unique: true, sparse: true });
    console.log('Unique index created successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixDuplicateMobiles();