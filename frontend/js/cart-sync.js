// Simple localStorage-based cart management
// No API calls - pure localStorage implementation

class LocalStorageCart {
    constructor() {
        this.storageKey = 'cartItems';
        this.addressKey = 'savedAddresses';
        this.favoritesKey = 'favoriteItems';
    }

    // ===== CART OPERATIONS =====

    // Load cart from localStorage
    loadCart() {
        try {
            const cartData = localStorage.getItem(this.storageKey);
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return [];
        }
    }

    // Save cart to localStorage
    saveCart(cart) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(cart));
            return true;
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
            return false;
        }
    }

    // Add item to cart
    addToCart(item) {
        const cart = this.loadCart();
        const existingItem = cart.find(cartItem => cartItem.id === item.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1 });
        }

        return this.saveCart(cart);
    }

    // Update cart item quantity
    updateCartItem(itemId, newQuantity) {
        const cart = this.loadCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);

        if (itemIndex !== -1) {
            if (newQuantity <= 0) {
                // Remove item if quantity is 0 or less
                cart.splice(itemIndex, 1);
            } else {
                cart[itemIndex].quantity = newQuantity;
            }
            return this.saveCart(cart);
        }
        return false;
    }

    // Remove item from cart
    removeFromCart(itemId) {
        const cart = this.loadCart();
        const filteredCart = cart.filter(item => item.id !== itemId);
        return this.saveCart(filteredCart);
    }

    // Clear entire cart
    clearCart() {
        localStorage.removeItem(this.storageKey);
        return true;
    }

    // Get cart item count
    getCartItemCount() {
        const cart = this.loadCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Get cart total price
    getCartTotal() {
        const cart = this.loadCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // ===== ADDRESS OPERATIONS =====

    // Load saved addresses
    loadSavedAddresses() {
        try {
            const addressData = localStorage.getItem(this.addressKey);
            return addressData ? JSON.parse(addressData) : [];
        } catch (error) {
            console.error('Error loading addresses from localStorage:', error);
            return [];
        }
    }

    // Save address
    saveAddress(addressData) {
        try {
            const addresses = this.loadSavedAddresses();
            
            // Generate a simple ID if not provided
            if (!addressData.id) {
                addressData.id = Date.now().toString();
            }
            
            // Add timestamp
            addressData.createdAt = new Date().toISOString();
            
            addresses.push(addressData);
            localStorage.setItem(this.addressKey, JSON.stringify(addresses));
            return { success: true, address: addressData };
        } catch (error) {
            console.error('Error saving address to localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete address
    deleteAddress(addressId) {
        try {
            const addresses = this.loadSavedAddresses();
            const filteredAddresses = addresses.filter(addr => addr.id !== addressId);
            localStorage.setItem(this.addressKey, JSON.stringify(filteredAddresses));
            return { success: true };
        } catch (error) {
            console.error('Error deleting address from localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== FAVORITES OPERATIONS =====

    // Load favorites from localStorage
    loadFavorites() {
        try {
            const favoritesData = localStorage.getItem(this.favoritesKey);
            return favoritesData ? JSON.parse(favoritesData) : [];
        } catch (error) {
            console.error('Error loading favorites from localStorage:', error);
            return [];
        }
    }

    // Save favorites to localStorage
    saveFavorites(favorites) {
        try {
            localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
            return true;
        } catch (error) {
            console.error('Error saving favorites to localStorage:', error);
            return false;
        }
    }

    // Add item to favorites
    addToFavorites(item) {
        const favorites = this.loadFavorites();
        const existingFavorite = favorites.find(favItem => favItem.id === item.id);

        if (!existingFavorite) {
            favorites.push(item);
            return this.saveFavorites(favorites);
        }
        return false; // Already in favorites
    }

    // Remove item from favorites
    removeFromFavorites(itemId) {
        const favorites = this.loadFavorites();
        const filteredFavorites = favorites.filter(item => item.id !== itemId);
        return this.saveFavorites(filteredFavorites);
    }

    // Toggle favorite status
    toggleFavorite(item) {
        const favorites = this.loadFavorites();
        const existingFavorite = favorites.find(favItem => favItem.id === item.id);

        if (existingFavorite) {
            // Remove from favorites
            this.removeFromFavorites(item.id);
            return false; // Now not favorite
        } else {
            // Add to favorites
            this.addToFavorites(item);
            return true; // Now is favorite
        }
    }

    // Check if item is in favorites
    isFavorite(itemId) {
        const favorites = this.loadFavorites();
        return favorites.some(favItem => favItem.id === itemId);
    }

    // Get favorites count
    getFavoritesCount() {
        const favorites = this.loadFavorites();
        return favorites.length;
    }

    // Clear all favorites
    clearFavorites() {
        localStorage.removeItem(this.favoritesKey);
        return true;
    }

    // ===== UTILITY METHODS =====

    // Sync cart data (useful for cross-tab synchronization)
    syncCart(newCartData) {
        return this.saveCart(newCartData);
    }

    // Get storage usage info
    getStorageInfo() {
        const cart = this.loadCart();
        const addresses = this.loadSavedAddresses();
        const favorites = this.loadFavorites();
        
        return {
            cartItems: cart.length,
            totalQuantity: this.getCartItemCount(),
            totalValue: this.getCartTotal(),
            savedAddresses: addresses.length,
            favoriteItems: favorites.length,
            storageKeys: [this.storageKey, this.addressKey, this.favoritesKey]
        };
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.addressKey);
        localStorage.removeItem(this.favoritesKey);
        return true;
    }
}

// Create global instance
const cartManager = new LocalStorageCart();

// Make it available globally for console testing
if (typeof window !== 'undefined') {
    window.cartManager = cartManager;
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageCart;
}
