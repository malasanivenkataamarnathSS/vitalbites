// Checkout API Integration Functions

class CheckoutAPI {
    constructor() {
        this.baseURL = 'http://localhost:8080'; // API Gateway URL
        this.token = localStorage.getItem('token');
    }

    // Helper method to make authenticated requests
    async makeRequest(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };

        const config = {
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        };

        const response = await fetch(`${this.baseURL}${url}`, config);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // ===== ADDRESS MANAGEMENT =====

    async loadSavedAddresses() {
        try {
            const data = await this.makeRequest('/api/auth/addresses');
            return data.addresses || [];
        } catch (error) {
            console.error('Failed to load addresses:', error);
            return JSON.parse(localStorage.getItem('savedAddresses') || '[]'); // Fallback
        }
    }

    async saveAddress(addressData) {
        try {
            const response = await this.makeRequest('/api/auth/addresses', {
                method: 'POST',
                body: JSON.stringify(addressData)
            });
            return response;
        } catch (error) {
            console.error('Failed to save address:', error);
            throw error;
        }
    }

    async deleteAddress(addressId) {
        try {
            const response = await this.makeRequest(`/api/auth/addresses/${addressId}`, {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('Failed to delete address:', error);
            throw error;
        }
    }

    async setDefaultAddress(addressId) {
        try {
            const response = await this.makeRequest(`/api/auth/addresses/${addressId}/default`, {
                method: 'PUT'
            });
            return response;
        } catch (error) {
            console.error('Failed to set default address:', error);
            throw error;
        }
    }

    // ===== CART MANAGEMENT =====

    async loadCart() {
        try {
            const data = await this.makeRequest('/api/cart');
            return data.items || [];
        } catch (error) {
            console.error('Failed to load cart:', error);
            return JSON.parse(localStorage.getItem('cartItems') || '[]'); // Fallback
        }
    }

    async addToCart(item) {
        try {
            const response = await this.makeRequest('/api/cart/add', {
                method: 'POST',
                body: JSON.stringify(item)
            });
            return response;
        } catch (error) {
            console.error('Failed to add to cart:', error);
            throw error;
        }
    }

    async updateCartItem(itemId, quantity) {
        try {
            const response = await this.makeRequest(`/api/cart/update/${itemId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity })
            });
            return response;
        } catch (error) {
            console.error('Failed to update cart item:', error);
            throw error;
        }
    }

    async removeFromCart(itemId) {
        try {
            const response = await this.makeRequest(`/api/cart/remove/${itemId}`, {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            throw error;
        }
    }

    async clearCart() {
        try {
            const response = await this.makeRequest('/api/cart/clear', {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('Failed to clear cart:', error);
            throw error;
        }
    }

    async syncCart(items) {
        try {
            const response = await this.makeRequest('/api/cart/sync', {
                method: 'POST',
                body: JSON.stringify({ items })
            });
            return response;
        } catch (error) {
            console.error('Failed to sync cart:', error);
            throw error;
        }
    }
}

// Global API instance
const checkoutAPI = new CheckoutAPI();

// ===== ENHANCED CHECKOUT FUNCTIONS =====

// Enhanced load cart function
async function loadCart() {
    if (!checkoutAPI.token) {
        return JSON.parse(localStorage.getItem('cartItems') || '[]');
    }

    try {
        // First, try to sync any local cart with backend
        const localCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
        if (localCart.length > 0) {
            await checkoutAPI.syncCart(localCart);
            localStorage.removeItem('cartItems'); // Clear local storage after sync
        }

        // Load from backend
        return await checkoutAPI.loadCart();
    } catch (error) {
        console.error('Error loading cart:', error);
        return JSON.parse(localStorage.getItem('cartItems') || '[]'); // Fallback
    }
}

// Enhanced update quantity function
async function updateQuantity(itemId, newQuantity) {
    if (newQuantity <= 0) {
        removeItem(itemId);
        return;
    }

    if (!checkoutAPI.token) {
        // Fallback to localStorage
        let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            cart[itemIndex].quantity = newQuantity;
            localStorage.setItem('cartItems', JSON.stringify(cart));
            displayCartItems();
        }
        return;
    }

    try {
        await checkoutAPI.updateCartItem(itemId, newQuantity);
        displayCartItems(); // Refresh display
        showAlert('Item quantity updated!', 'success');
    } catch (error) {
        showAlert('Failed to update item quantity', 'error');
        console.error('Error updating quantity:', error);
    }
}

// Enhanced remove item function
async function removeItem(itemId) {
    if (!checkoutAPI.token) {
        // Fallback to localStorage
        let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('cartItems', JSON.stringify(cart));
        displayCartItems();
        return;
    }

    try {
        await checkoutAPI.removeFromCart(itemId);
        displayCartItems(); // Refresh display
        showAlert('Item removed from cart!', 'success');

        // Check if cart is empty
        const cart = await checkoutAPI.loadCart();
        if (cart.length === 0) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } catch (error) {
        showAlert('Failed to remove item', 'error');
        console.error('Error removing item:', error);
    }
}

// Enhanced load saved addresses function
async function loadSavedAddresses() {
    if (!checkoutAPI.token) {
        // Fallback to localStorage
        const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        populateAddressDropdown(addresses);
        return;
    }

    try {
        const addresses = await checkoutAPI.loadSavedAddresses();
        populateAddressDropdown(addresses);
    } catch (error) {
        console.error('Error loading addresses:', error);
        showAlert('Failed to load saved addresses', 'warning');
    }
}

// Helper function to populate address dropdown
function populateAddressDropdown(addresses) {
    const select = document.getElementById('saved-addresses');
    select.innerHTML = '<option value="">Select a saved address</option>';

    addresses.forEach((addr, i) => {
        const option = document.createElement('option');
        option.value = addr.id || i; // Use MongoDB _id if available
        option.textContent = `${addr.fullName}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
        if (addr.isDefault) {
            option.textContent += ' (Default)';
        }
        select.appendChild(option);
    });
}

// Enhanced save address function
async function saveAddress() {
    const addressData = {
        fullName: document.getElementById('fullName').value,
        mobile: document.getElementById('mobile').value,
        street: document.getElementById('street').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        deliveryInstructions: document.getElementById('deliveryInstructions').value || '',
        isDefault: false
    };

    // Validation
    if (!addressData.fullName || !addressData.mobile || !addressData.street ||
        !addressData.city || !addressData.state || !addressData.pincode) {
        showAlert('Fill all address fields before saving!', 'warning');
        return;
    }

    if (!checkoutAPI.token) {
        // Fallback to localStorage
        const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        addresses.push(addressData);
        localStorage.setItem('savedAddresses', JSON.stringify(addresses));
        loadSavedAddresses();
        showAlert('Address saved locally!', 'success');
        return;
    }

    try {
        await checkoutAPI.saveAddress(addressData);
        showAlert('Address saved successfully!', 'success');
        loadSavedAddresses(); // Refresh the dropdown
    } catch (error) {
        showAlert('Failed to save address', 'error');
        console.error('Error saving address:', error);
    }
}

// Enhanced delete address function
async function deleteSelectedAddress() {
    const select = document.getElementById('saved-addresses');
    const addressId = select.value;

    if (!addressId) {
        showAlert('Please select an address to delete.', 'warning');
        return;
    }

    if (!checkoutAPI.token) {
        // Fallback to localStorage
        let addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        addresses.splice(parseInt(addressId), 1);
        localStorage.setItem('savedAddresses', JSON.stringify(addresses));
        loadSavedAddresses();
        showAlert('Address deleted!', 'success');
        return;
    }

    try {
        await checkoutAPI.deleteAddress(addressId);
        showAlert('Address deleted successfully!', 'success');
        loadSavedAddresses(); // Refresh the dropdown
        select.value = ''; // Reset selection
    } catch (error) {
        showAlert('Failed to delete address', 'error');
        console.error('Error deleting address:', error);
    }
}
