const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  restaurant: String,
  available: { type: Boolean, default: true }
});

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

async function createSampleMenuItems() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/menudb', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('Connected to Menu DB');
    
    // Clear existing items
    await MenuItem.deleteMany({});
    
    // Sample menu items
    const sampleItems = [
      {
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese cubes marinated in aromatic spices and yogurt, served with mint chutney.',
        price: 249,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      },
      {
        name: 'Butter Chicken',
        description: 'Tender chicken pieces cooked in creamy tomato-based sauce with butter and Indian spices.',
        price: 299,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      },
      {
        name: 'Masala Dosa',
        description: 'Crispy rice and lentil crepe stuffed with spiced potato filling, served with sambar and chutney.',
        price: 129,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      },
      {
        name: 'Biryani (Chicken)',
        description: 'Fragrant basmati rice cooked with tender chicken, aromatic spices, and saffron.',
        price: 349,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      },
      {
        name: 'Palak Paneer',
        description: 'Fresh cottage cheese cubes cooked in creamy spinach gravy with traditional spices.',
        price: 229,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      },
      {
        name: 'Garlic Naan',
        description: 'Soft and fluffy Indian bread topped with minced garlic and fresh herbs.',
        price: 59,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      },
      {
        name: 'Rajma Rice',
        description: 'Red kidney beans curry served with steamed basmati rice and pickles.',
        price: 179,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      },
      {
        name: 'Aloo Gobi',
        description: 'Cauliflower and potato curry cooked with onions, tomatoes, and aromatic spices.',
        price: 199,
        restaurant: 'VitalBites Kitchen',
        available: false,
        image: ''
      },
      {
        name: 'Mutton Curry',
        description: 'Tender mutton pieces slow-cooked in rich gravy with traditional spices.',
        price: 399,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      },
      {
        name: 'Gulab Jamun',
        description: 'Soft milk dumplings soaked in rose-flavored sugar syrup, served warm.',
        price: 89,
        restaurant: 'VitalBites Kitchen',
        available: true,
        image: ''
      }
    ];
    
    await MenuItem.insertMany(sampleItems);
    console.log(`Created ${sampleItems.length} sample menu items`);
    
  } catch (error) {
    console.error('Error creating sample menu items:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSampleMenuItems();