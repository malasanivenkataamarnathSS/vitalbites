const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: String,
        restaurant: String,
        addedAt: { type: Date, default: Date.now }
    }],
    totalAmount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Calculate total amount before saving
CartSchema.pre('save', function (next) {
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.lastUpdated = new Date();
    next();
});

// Remove expired carts (older than 30 days)
CartSchema.index({ "lastUpdated": 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Cart', CartSchema);