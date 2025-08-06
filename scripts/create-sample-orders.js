const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: String,
  items: [
    {
      menuItemId: String,
      name: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ],
  address: String,
  phone: String,
  status: { type: String, default: 'Processing' },
  total: Number,
  created: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

async function createSampleOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/orderdb', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('Connected to Order DB');
    
    // Clear existing orders
    await Order.deleteMany({});
    
    // Sample orders
    const sampleOrders = [
      {
        userId: 'user1',
        items: [
          {
            menuItemId: 'item1',
            name: 'Paneer Tikka',
            price: 249,
            quantity: 1,
            image: ''
          },
          {
            menuItemId: 'item2',
            name: 'Garlic Naan',
            price: 59,
            quantity: 2,
            image: ''
          }
        ],
        address: 'Flat 101, Green Residency, Mumbai - 400001',
        phone: '+919876543210',
        status: 'Delivered',
        total: 367,
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        userId: 'user2',
        items: [
          {
            menuItemId: 'item3',
            name: 'Butter Chicken',
            price: 299,
            quantity: 1,
            image: ''
          },
          {
            menuItemId: 'item4',
            name: 'Biryani (Chicken)',
            price: 349,
            quantity: 1,
            image: ''
          }
        ],
        address: '2nd Floor, Tech Park, Pune - 411001',
        phone: '+919876543211',
        status: 'Processing',
        total: 648,
        created: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        userId: 'user3',
        items: [
          {
            menuItemId: 'item5',
            name: 'Masala Dosa',
            price: 129,
            quantity: 2,
            image: ''
          }
        ],
        address: 'House No. 45, Sector 12, Gurgaon - 122001',
        phone: '+919876543212',
        status: 'Out for Delivery',
        total: 258,
        created: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        userId: 'user4',
        items: [
          {
            menuItemId: 'item6',
            name: 'Palak Paneer',
            price: 229,
            quantity: 1,
            image: ''
          },
          {
            menuItemId: 'item7',
            name: 'Rajma Rice',
            price: 179,
            quantity: 1,
            image: ''
          },
          {
            menuItemId: 'item8',
            name: 'Gulab Jamun',
            price: 89,
            quantity: 1,
            image: ''
          }
        ],
        address: 'Apartment 23B, Rose Garden, Bangalore - 560001',
        phone: '+919876543213',
        status: 'Delivered',
        total: 497,
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        userId: 'user5',
        items: [
          {
            menuItemId: 'item9',
            name: 'Mutton Curry',
            price: 399,
            quantity: 1,
            image: ''
          }
        ],
        address: 'Villa 12, Sunflower Society, Hyderabad - 500001',
        phone: '+919876543214',
        status: 'Cancelled',
        total: 399,
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        userId: 'user1',
        items: [
          {
            menuItemId: 'item4',
            name: 'Biryani (Chicken)',
            price: 349,
            quantity: 2,
            image: ''
          }
        ],
        address: 'Flat 101, Green Residency, Mumbai - 400001',
        phone: '+919876543210',
        status: 'Preparing',
        total: 698,
        created: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      }
    ];
    
    await Order.insertMany(sampleOrders);
    console.log(`Created ${sampleOrders.length} sample orders`);
    
  } catch (error) {
    console.error('Error creating sample orders:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSampleOrders();