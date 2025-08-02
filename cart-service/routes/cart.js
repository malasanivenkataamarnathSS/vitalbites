const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const logger = require('../utils/logger');
const { 
    cartItemSchema, 
    updateQuantitySchema, 
    cartSyncSchema 
} = require('../validators/cartValidators');

// Validation middleware
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            logger.warn('Cart validation failed:', {
                errors: errorMessages,
                userId: req.user?.id,
                ip: req.ip
            });
            
            return res.status(400).json({
                error: 'Validation failed',
                details: errorMessages
            });
        }
        
        req.body = value;
        next();
    };
};

// Get user's cart
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
            await cart.save();
            logger.info('New cart created for user', { userId });
        }

        logger.debug('Cart fetched successfully', { 
            userId, 
            itemCount: cart.items.length,
            totalAmount: cart.totalAmount 
        });

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        logger.error('Error fetching cart:', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({ 
            error: 'Failed to fetch cart',
            message: 'Please try again later'
        });
    }
});

// Add item to cart
router.post('/add', validateRequest(cartItemSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, name, price, quantity = 1, image, restaurant } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if adding this item would exceed cart limit
        if (!cart.items.find(item => item.id === id) && cart.items.length >= 20) {
            logger.warn('Cart item limit exceeded', { userId, currentItemCount: cart.items.length });
            return res.status(400).json({ 
                error: 'Cart limit exceeded',
                message: 'Maximum 20 different items allowed in cart'
            });
        }

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(item => item.id === id);

        if (existingItemIndex > -1) {
            // Update quantity if item exists
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > 50) {
                logger.warn('Item quantity limit exceeded', { 
                    userId, 
                    itemId: id, 
                    currentQuantity: cart.items[existingItemIndex].quantity,
                    requestedAddition: quantity
                });
                return res.status(400).json({ 
                    error: 'Quantity limit exceeded',
                    message: 'Maximum 50 quantity allowed per item'
                });
            }
            cart.items[existingItemIndex].quantity = newQuantity;
            logger.info('Cart item quantity updated', { 
                userId, 
                itemId: id, 
                newQuantity 
            });
        } else {
            // Add new item
            cart.items.push({ id, name, price, quantity, image, restaurant });
            logger.info('New item added to cart', { 
                userId, 
                itemId: id, 
                itemName: name, 
                quantity 
            });
        }

        await cart.save();
        res.json({ 
            success: true,
            message: 'Item added to cart successfully', 
            data: cart 
        });
    } catch (error) {
        logger.error('Error adding item to cart:', {
            error: error.message,
            userId: req.user?.id,
            itemData: req.body
        });
        res.status(500).json({ 
            error: 'Failed to add item to cart',
            message: 'Please try again later'
        });
    }
});

// Update item quantity
router.put('/update/:itemId', validateRequest(updateQuantitySchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            logger.warn('Cart not found for quantity update', { userId, itemId });
            return res.status(404).json({ 
                error: 'Cart not found',
                message: 'Please refresh and try again'
            });
        }

        const item = cart.items.find(item => item.id === itemId);
        if (!item) {
            logger.warn('Item not found in cart for quantity update', { userId, itemId });
            return res.status(404).json({ 
                error: 'Item not found in cart',
                message: 'The item may have been removed'
            });
        }

        item.quantity = quantity;
        await cart.save();

        logger.info('Cart item quantity updated', { 
            userId, 
            itemId, 
            newQuantity: quantity 
        });

        res.json({ 
            success: true,
            message: 'Item quantity updated successfully', 
            data: cart 
        });
    } catch (error) {
        logger.error('Error updating cart item quantity:', {
            error: error.message,
            userId: req.user?.id,
            itemId: req.params.itemId,
            quantity: req.body.quantity
        });
        res.status(500).json({ 
            error: 'Failed to update item quantity',
            message: 'Please try again later'
        });
    }
});

// Remove item from cart
router.delete('/remove/:itemId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            logger.warn('Cart not found for item removal', { userId, itemId });
            return res.status(404).json({ 
                error: 'Cart not found',
                message: 'Please refresh and try again'
            });
        }

        const initialItemCount = cart.items.length;
        cart.items = cart.items.filter(item => item.id !== itemId);

        if (cart.items.length === initialItemCount) {
            logger.warn('Item not found in cart for removal', { userId, itemId });
            return res.status(404).json({ 
                error: 'Item not found in cart',
                message: 'The item may have already been removed'
            });
        }

        await cart.save();

        logger.info('Item removed from cart', { 
            userId, 
            itemId, 
            remainingItems: cart.items.length 
        });

        res.json({ 
            success: true,
            message: 'Item removed from cart successfully', 
            data: cart 
        });
    } catch (error) {
        logger.error('Error removing item from cart:', {
            error: error.message,
            userId: req.user?.id,
            itemId: req.params.itemId
        });
        res.status(500).json({ 
            error: 'Failed to remove item from cart',
            message: 'Please try again later'
        });
    }
});

// Clear entire cart
router.delete('/clear', async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await Cart.findOneAndUpdate(
            { userId },
            { items: [], totalAmount: 0 },
            { upsert: true, new: true }
        );

        logger.info('Cart cleared successfully', { 
            userId, 
            previousItemCount: result.items.length 
        });

        res.json({ 
            success: true,
            message: 'Cart cleared successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error clearing cart:', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({ 
            error: 'Failed to clear cart',
            message: 'Please try again later'
        });
    }
});

// Sync frontend cart with backend (useful for login scenarios)
router.post('/sync', validateRequest(cartSyncSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { items } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId });
        }

        const originalItemCount = cart.items.length;

        // Merge frontend items with backend cart
        items.forEach(frontendItem => {
            const existingIndex = cart.items.findIndex(item => item.id === frontendItem.id);
            if (existingIndex > -1) {
                // Update existing item with higher quantity (but respect limits)
                const newQuantity = Math.max(
                    cart.items[existingIndex].quantity,
                    frontendItem.quantity
                );
                cart.items[existingIndex].quantity = Math.min(newQuantity, 50);
            } else if (cart.items.length < 20) {
                // Add new item if cart isn't full
                cart.items.push({
                    ...frontendItem,
                    quantity: Math.min(frontendItem.quantity, 50)
                });
            }
        });

        await cart.save();

        logger.info('Cart synced successfully', { 
            userId, 
            originalItemCount,
            syncedItemCount: items.length,
            finalItemCount: cart.items.length
        });

        res.json({ 
            success: true,
            message: 'Cart synced successfully', 
            data: cart 
        });
    } catch (error) {
        logger.error('Error syncing cart:', {
            error: error.message,
            userId: req.user?.id,
            itemCount: req.body.items?.length
        });
        res.status(500).json({ 
            error: 'Failed to sync cart',
            message: 'Please try again later'
        });
    }
});

// Get cart summary (item count, total, etc.)
router.get('/summary', async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId });

        if (!cart || cart.items.length === 0) {
            return res.json({
                success: true,
                data: {
                    itemCount: 0,
                    totalQuantity: 0,
                    totalAmount: 0,
                    isEmpty: true
                }
            });
        }

        const summary = {
            itemCount: cart.items.length,
            totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            totalAmount: cart.totalAmount,
            isEmpty: false,
            lastUpdated: cart.lastUpdated
        };

        logger.debug('Cart summary fetched', { userId, summary });

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        logger.error('Error fetching cart summary:', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({ 
            error: 'Failed to fetch cart summary',
            message: 'Please try again later'
        });
    }
});

module.exports = router;
