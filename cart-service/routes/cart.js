const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Get user's cart
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id; // From JWT middleware
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
            await cart.save();
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add item to cart
router.post('/add', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, name, price, quantity = 1, image, restaurant } = req.body;

        if (!id || !name || !price) {
            return res.status(400).json({ message: 'Item id, name, and price are required' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(item => item.id === id);

        if (existingItemIndex > -1) {
            // Update quantity if item exists
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({ id, name, price, quantity, image, restaurant });
        }

        await cart.save();
        res.json({ message: 'Item added to cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update item quantity
router.put('/update/:itemId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.find(item => item.id === itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        item.quantity = quantity;
        await cart.save();

        res.json({ message: 'Item quantity updated', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:itemId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.id !== itemId);
        await cart.save();

        res.json({ message: 'Item removed from cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Clear entire cart
router.delete('/clear', async (req, res) => {
    try {
        const userId = req.user.id;

        await Cart.findOneAndUpdate(
            { userId },
            { items: [], totalAmount: 0 },
            { upsert: true }
        );

        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Sync frontend cart with backend (useful for login scenarios)
router.post('/sync', async (req, res) => {
    try {
        const userId = req.user.id;
        const { items } = req.body;

        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Items must be an array' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId });
        }

        // Merge frontend items with backend cart
        items.forEach(frontendItem => {
            const existingIndex = cart.items.findIndex(item => item.id === frontendItem.id);
            if (existingIndex > -1) {
                // Update existing item with higher quantity
                cart.items[existingIndex].quantity = Math.max(
                    cart.items[existingIndex].quantity,
                    frontendItem.quantity
                );
            } else {
                // Add new item from frontend
                cart.items.push(frontendItem);
            }
        });

        await cart.save();
        res.json({ message: 'Cart synced successfully', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
