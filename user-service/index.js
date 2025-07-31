require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserProfile = require('./models/UserProfile');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('User DB connected'));

// Get user profile
app.get('/api/user/:userId', async (req, res) => {
  const user = await UserProfile.findOne({ userId: req.params.userId });
  res.json(user);
});

// Update user profile
app.put('/api/user/:userId', async (req, res) => {
  const user = await UserProfile.findOneAndUpdate({ userId: req.params.userId }, req.body, { new: true, upsert: true });
  res.json(user);
});

app.listen(5003, () => console.log('User Service on 5003'));