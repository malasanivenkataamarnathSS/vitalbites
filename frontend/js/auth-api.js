// Enhanced Authentication API - No localStorage dependencies

class AuthAPI {
    constructor() {
        this.baseURL = 'http://localhost:8080';
        this.user = null;
        this.token = null;
        this.initializeAuth();
    }

    // Initialize authentication from session
    async initializeAuth() {
        this.token = sessionStorage.getItem('vitalbites_token');
        const userStr = sessionStorage.getItem('vitalbites_user');
        
        if (userStr) {
            try {
                this.user = JSON.parse(userStr);
            } catch (error) {
                console.warn('Invalid user data in session storage');
                this.clearAuth();
            }
        }

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
                sessionStorage.setItem('vitalbites_user', JSON.stringify(this.user));
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

    // Set authentication data
    setAuth(token, user) {
        this.token = token;
        this.user = user;
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

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Send OTP to email
    async sendOTP(email) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to send OTP');
            }

            return data;
        } catch (error) {
            console.error('Send OTP error:', error);
            throw error;
        }
    }

    // Verify OTP
    async verifyOTP(email, otp) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'OTP verification failed');
            }

            return data;
        } catch (error) {
            console.error('Verify OTP error:', error);
            throw error;
        }
    }

    // Complete registration for new users
    async completeRegistration(email, username, mobile) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/complete-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, mobile })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Registration failed');
            }

            if (data.success && data.token && data.user) {
                this.setAuth(data.token, data.user);
            }

            return data;
        } catch (error) {
            console.error('Complete registration error:', error);
            throw error;
        }
    }

    // Logout user
    logout() {
        this.clearAuth();
        window.location.href = '/login.html';
    }

    // Redirect to login page
    redirectToLogin() {
        sessionStorage.setItem('vitalbites_returnUrl', window.location.pathname);
        window.location.href = '/login.html';
    }

    // Redirect to return URL or home
    redirectAfterLogin() {
        const returnUrl = sessionStorage.getItem('vitalbites_returnUrl');
        sessionStorage.removeItem('vitalbites_returnUrl');
        window.location.href = returnUrl || '/index.html';
    }

    // Show loading state
    showLoading(element, text = 'Loading...') {
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <span class="loading-spinner"></span>
            ${text}
        `;
        element.disabled = true;
        return originalContent;
    }

    // Hide loading state
    hideLoading(element, originalContent) {
        element.innerHTML = originalContent;
        element.disabled = false;
    }

    // Show error message
    showError(message, containerId = null) {
        const errorHtml = `
            <div class="alert alert-error" style="background: #fee; border: 1px solid #f99; color: #c33; padding: 12px; border-radius: 4px; margin: 10px 0;">
                <strong>Error:</strong> ${message}
            </div>
        `;

        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = errorHtml;
                return;
            }
        }

        // Create floating notification
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
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Show success message
    showSuccess(message, containerId = null) {
        const successHtml = `
            <div class="alert alert-success" style="background: #efe; border: 1px solid #9f9; color: #393; padding: 12px; border-radius: 4px; margin: 10px 0;">
                <strong>Success:</strong> ${message}
            </div>
        `;

        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = successHtml;
                return;
            }
        }

        // Create floating notification
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
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    // Clear messages
    clearMessages(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }

    // Format mobile number for display
    formatMobileForDisplay(mobile) {
        if (!mobile) return '';
        return mobile.replace('+91', '');
    }

    // Format mobile number for API
    formatMobileForAPI(mobile) {
        if (!mobile) return '';
        const cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length === 10) {
            return `+91${cleanMobile}`;
        }
        return mobile;
    }

    // Validate email
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate mobile number
    validateMobile(mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        return cleanMobile.length === 10 && /^[6-9]/.test(cleanMobile);
    }

    // Validate name
    validateName(name) {
        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        return nameRegex.test(name.trim());
    }

    // Validate OTP
    validateOTP(otp) {
        const otpRegex = /^\d{6}$/;
        return otpRegex.test(otp);
    }
}

// Create global instance
window.authAPI = new AuthAPI();

// Add CSS for animations and components
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-notification, .success-notification {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
    }
`;
document.head.appendChild(style);