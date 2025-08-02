// Enhanced Checkout API Integration Functions - No localStorage dependencies

class CheckoutAPI {
    constructor() {
        this.baseURL = 'http://localhost:8080'; // API Gateway URL
        this.token = null;
        this.user = null;
        this.initializeAuth();
    }

    // Initialize authentication from session storage or prompt login
    async initializeAuth() {
        // Try to get token from session storage (temporary storage only)
        this.token = sessionStorage.getItem('vitalbites_token');
        
        if (this.token) {
            try {
                await this.verifyToken();
            } catch (error) {
                console.warn('Token verification failed, clearing session');
                this.clearAuth();
            }
        }
    }

    // Verify if current token is valid
    async verifyToken() {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${this.baseURL}/api/auth/verify`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                return true;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.clearAuth();
            return false;
        }
    }

    // Set authentication token and user info
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        // Store only in session storage, not localStorage
        sessionStorage.setItem('vitalbites_token', token);
        sessionStorage.setItem('vitalbites_user', JSON.stringify(user));
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('vitalbites_token');
        sessionStorage.removeItem('vitalbites_user');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            sessionStorage.setItem('vitalbites_returnUrl', window.location.pathname);
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    // Helper method to make authenticated requests
    async makeRequest(url, options = {}) {
        if (!this.requireAuth()) return null;

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };

        const config = {
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);

            if (response.status === 401) {
                // Token expired or invalid
                this.clearAuth();
                this.requireAuth();
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error(`API request failed for ${url}:`, error);
            throw error;
        }
    }

    // ===== ADDRESS MANAGEMENT =====

    async loadSavedAddresses() {
        try {
            const data = await this.makeRequest('/api/auth/addresses');
            return data?.addresses || [];
        } catch (error) {
            console.error('Failed to load addresses:', error);
            throw new Error('Unable to load saved addresses. Please try again.');
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
            throw new Error('Unable to save address. Please try again.');
        }
    }

    async updateAddress(addressId, addressData) {
        try {
            const response = await this.makeRequest(`/api/auth/addresses/${addressId}`, {
                method: 'PUT',
                body: JSON.stringify(addressData)
            });
            return response;
        } catch (error) {
            console.error('Failed to update address:', error);
            throw new Error('Unable to update address. Please try again.');
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
            throw new Error('Unable to delete address. Please try again.');
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
            throw new Error('Unable to set default address. Please try again.');
        }
    }

    // ===== CART MANAGEMENT =====

    async loadCart() {
        try {
            const data = await this.makeRequest('/api/cart');
            return data?.items || [];
        } catch (error) {
            console.error('Failed to load cart:', error);
            throw new Error('Unable to load cart. Please try again.');
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
            throw new Error('Unable to add item to cart. Please try again.');
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
            throw new Error('Unable to update cart item. Please try again.');
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
            throw new Error('Unable to remove item from cart. Please try again.');
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
            throw new Error('Unable to clear cart. Please try again.');
        }
    }

    async syncCart(cartItems) {
        try {
            const response = await this.makeRequest('/api/cart/sync', {
                method: 'POST',
                body: JSON.stringify({ items: cartItems })
            });
            return response;
        } catch (error) {
            console.error('Failed to sync cart:', error);
            throw new Error('Unable to sync cart. Please try again.');
        }
    }

    // ===== ORDER MANAGEMENT =====

    async placeOrder(orderData) {
        try {
            const response = await this.makeRequest('/api/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            return response;
        } catch (error) {
            console.error('Failed to place order:', error);
            throw new Error('Unable to place order. Please try again.');
        }
    }

    async getOrderHistory() {
        try {
            const data = await this.makeRequest(`/api/orders/${this.user.id}`);
            return data || [];
        } catch (error) {
            console.error('Failed to load order history:', error);
            throw new Error('Unable to load order history. Please try again.');
        }
    }

    // ===== MENU MANAGEMENT =====

    async loadMenu(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const url = `/api/menu${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await fetch(`${this.baseURL}${url}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load menu: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data || { items: [], pagination: {} };
        } catch (error) {
            console.error('Failed to load menu:', error);
            throw new Error('Unable to load menu. Please try again.');
        }
    }

    async getMenuCategories() {
        try {
            const response = await fetch(`${this.baseURL}/api/menu/categories`);
            if (!response.ok) {
                throw new Error(`Failed to load categories: ${response.status}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Failed to load categories:', error);
            return [];
        }
    }

    async getRestaurants() {
        try {
            const response = await fetch(`${this.baseURL}/api/menu/restaurants`);
            if (!response.ok) {
                throw new Error(`Failed to load restaurants: ${response.status}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Failed to load restaurants:', error);
            return [];
        }
    }

    // ===== USER PROFILE MANAGEMENT =====

    async getUserProfile() {
        try {
            const data = await this.makeRequest('/api/auth/profile');
            return data;
        } catch (error) {
            console.error('Failed to load user profile:', error);
            throw new Error('Unable to load profile. Please try again.');
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await this.makeRequest('/api/auth/update-profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            return response;
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw new Error('Unable to update profile. Please try again.');
        }
    }

    // ===== UTILITY METHODS =====

    showError(message) {
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Create a simple success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    // Calculate cart total
    calculateCartTotal(cartItems) {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }
}

// Create global instance
window.checkoutAPI = new CheckoutAPI();

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .error-notification, .success-notification {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);