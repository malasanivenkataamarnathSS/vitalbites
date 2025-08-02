const express = require('express');
const router = express.Router();
const User = require('../models/User'); // You'll need to import User model here

// Get all addresses for a user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id; // From JWT middleware
        const user = await User.findById(userId).select('addresses');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ addresses: user.addresses || [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new address
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, mobile, street, city, state, pincode, deliveryInstructions, isDefault } = req.body;

        // Validation
        if (!fullName || !mobile || !street || !city || !state || !pincode) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
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

        res.status(201).json({
            message: 'Address added successfully',
            address: user.addresses[user.addresses.length - 1]
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update address
router.put('/:addressId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.params;
        const updates = req.body;

        const user = await User.findById(userId);
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
router.delete('/:addressId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = address.isDefault;
        address.remove();

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
router.put('/:addressId/default', async (req, res) => {
    try {
        const userId = req.user.id;
        const { addressId } = req.params;

        const user = await User.findById(userId);
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

module.exports = router;
