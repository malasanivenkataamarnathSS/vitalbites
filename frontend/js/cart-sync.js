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

    // Save favorites to localStorage (internal use only)
    saveFavorites(favorites) {
        try {
            localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
            return true;
        } catch (error) {
            console.error('Error saving favorites to localStorage:', error);
            return false;
        }
    }

    // Add item to favorites (internal use only)
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




}

// Create global instance
const cartManager = new LocalStorageCart();
