// Admin Panel JavaScript for VitalBites
class AdminPanel {
  constructor() {
    this.apiBase = '/api';
    this.token = localStorage.getItem('adminToken');
    this.currentUser = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuth();
  }

  // Setup all event listeners
  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Send OTP button
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', () => this.sendOTP());
    }

    // Tab navigation
    const tabButtons = document.querySelectorAll('.sidebar-nav button');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Menu form
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
      menuForm.addEventListener('submit', (e) => this.handleMenuSubmit(e));
    }

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.modal-close, #closeMenuModal');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeModals());
    });

    // Add menu button
    const addMenuBtn = document.getElementById('addMenuBtn');
    if (addMenuBtn) {
      addMenuBtn.addEventListener('click', () => this.showAddMenuModal());
    }

    // Logout buttons
    const logoutButtons = document.querySelectorAll('[onclick*="logout"], [data-action="logout"]');
    logoutButtons.forEach(btn => {
      btn.addEventListener('click', () => this.logout());
    });
  }

  // Check authentication status
  async checkAuth() {
    if (!this.token) {
      this.showLogin();
      return;
    }

    try {
      const response = await this.apiCall('/auth/verify', 'GET');
      if (response.user && response.user.role === 'admin') {
        this.currentUser = response.user;
        this.showDashboard();
        this.loadDashboardData();
      } else {
        this.showLogin();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.showLogin();
    }
  }

  // Send OTP for login
  async sendOTP() {
    const email = document.getElementById('adminEmail').value.trim();
    if (!email) {
      this.showError('Please enter your email');
      return;
    }

    try {
      const sendOtpBtn = document.getElementById('sendOtpBtn');
      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = 'Sending...';

      await this.apiCall('/auth/send-otp', 'POST', { email });
      
      this.showSuccess('OTP sent to your email');
      document.getElementById('otpSection').style.display = 'block';
      
      // Start countdown
      this.startOtpCountdown();
    } catch (error) {
      this.showError(error.message || 'Failed to send OTP');
    } finally {
      const sendOtpBtn = document.getElementById('sendOtpBtn');
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Send OTP';
    }
  }

  // Handle admin login
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value.trim();
    const otp = document.getElementById('adminOtp').value.trim();

    if (!email || !otp) {
      this.showError('Please enter both email and OTP');
      return;
    }

    try {
      const loginBtn = document.querySelector('#adminLoginForm button[type="submit"]');
      loginBtn.disabled = true;
      loginBtn.textContent = 'Verifying...';

      const response = await this.apiCall('/auth/admin/login', 'POST', { email, otp });
      
      this.token = response.token;
      localStorage.setItem('adminToken', this.token);
      this.currentUser = response;
      
      this.showSuccess('Login successful');
      this.showDashboard();
      this.loadDashboardData();
    } catch (error) {
      this.showError(error.message || 'Login failed');
    } finally {
      const loginBtn = document.querySelector('#adminLoginForm button[type="submit"]');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  }

  // Start OTP countdown
  startOtpCountdown() {
    let countdown = 30;
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    
    const timer = setInterval(() => {
      sendOtpBtn.textContent = `Resend in ${countdown}s`;
      sendOtpBtn.disabled = true;
      countdown--;
      
      if (countdown < 0) {
        clearInterval(timer);
        sendOtpBtn.textContent = 'Resend OTP';
        sendOtpBtn.disabled = false;
      }
    }, 1000);
  }

  // Show login screen
  showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
  }

  // Show dashboard
  showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'flex';
    
    // Update admin name
    if (this.currentUser) {
      const nameElements = document.querySelectorAll('#adminName, #adminWelcomeName');
      nameElements.forEach(el => {
        el.textContent = this.currentUser.username || this.currentUser.email;
      });
    }
  }

  // Switch tabs
  switchTab(tabName) {
    if (tabName === 'logout') {
      this.logout();
      return;
    }

    // Update active tab
    document.querySelectorAll('.sidebar-nav button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Show corresponding content
    document.querySelectorAll('.tab-section').forEach(section => {
      section.style.display = 'none';
    });
    document.getElementById(`${tabName}Tab`).style.display = 'block';

    // Load data for the tab
    this.loadTabData(tabName);
  }

  // Load data for specific tab
  async loadTabData(tabName) {
    switch (tabName) {
      case 'dashboard':
        await this.loadDashboardData();
        break;
      case 'users':
        await this.loadUsersData();
        break;
      case 'orders':
        await this.loadOrdersData();
        break;
      case 'addresses':
        await this.loadAddressesData();
        break;
      case 'menu':
        await this.loadMenuData();
        break;
    }
  }

  // Load dashboard data
  async loadDashboardData() {
    try {
      const [authStats, orderStats, menuStats] = await Promise.all([
        this.apiCall('/auth/admin/stats'),
        this.apiCall('/orders/admin/stats'),
        this.apiCall('/menu/admin/stats')
      ]);

      // Update dashboard cards
      document.getElementById('userCount').textContent = authStats.totalUsers;
      document.getElementById('activeUserCount').textContent = authStats.activeUsers;
      document.getElementById('orderCount').textContent = orderStats.totalOrders;
      document.getElementById('deliveredOrderCount').textContent = orderStats.deliveredOrders;

      // Update recent orders table
      if (orderStats.recentOrders) {
        this.renderRecentOrders(orderStats.recentOrders);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  // Load users data
  async loadUsersData() {
    try {
      const response = await this.apiCall('/auth/admin/users');
      this.renderUsersTable(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
      this.showError('Failed to load users');
    }
  }

  // Load orders data
  async loadOrdersData() {
    try {
      const response = await this.apiCall('/orders');
      this.renderOrdersTable(response.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      this.showError('Failed to load orders');
    }
  }

  // Load addresses data
  async loadAddressesData() {
    try {
      const response = await this.apiCall('/auth/admin/addresses');
      this.renderAddressesTable(response.addresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      this.showError('Failed to load addresses');
    }
  }

  // Load menu data
  async loadMenuData() {
    try {
      const response = await this.apiCall('/menu');
      this.renderMenuTable(response);
    } catch (error) {
      console.error('Error loading menu:', error);
      this.showError('Failed to load menu items');
    }
  }

  // Render recent orders table
  renderRecentOrders(orders) {
    const tbody = document.getElementById('dashboardOrdersTable');
    tbody.innerHTML = orders.map(order => `
      <tr>
        <td>#${order._id.slice(-6)}</td>
        <td>User ${order.userId.slice(-6)}</td>
        <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
        <td>₹${order.total}</td>
        <td>${new Date(order.created).toLocaleDateString()}</td>
      </tr>
    `).join('');
  }

  // Render users table
  renderUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td><span class="status ${user.status}">${user.status}</span></td>
        <td>
          <button class="action-btn" onclick="adminPanel.editUser('${user.id}')" aria-label="Edit User">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn" onclick="adminPanel.deleteUser('${user.id}')" aria-label="Delete User">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Render orders table
  renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTable');
    tbody.innerHTML = orders.map(order => `
      <tr>
        <td>#${order._id.slice(-6)}</td>
        <td>User ${order.userId.slice(-6)}</td>
        <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
        <td>₹${order.total}</td>
        <td>${new Date(order.created).toLocaleDateString()}</td>
        <td>
          <button class="action-btn" onclick="adminPanel.editOrder('${order._id}')" aria-label="Edit Order">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn" onclick="adminPanel.deleteOrder('${order._id}')" aria-label="Delete Order">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Render addresses table
  renderAddressesTable(addresses) {
    const tbody = document.getElementById('addressesTable');
    tbody.innerHTML = addresses.map(addr => `
      <tr>
        <td>${addr.userName}</td>
        <td>${addr.label}</td>
        <td>${addr.fullAddress}</td>
        <td>
          <button class="action-btn" onclick="adminPanel.viewAddress('${addr.id}')" aria-label="View Address">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Render menu table
  renderMenuTable(items) {
    const tbody = document.getElementById('menuTable');
    tbody.innerHTML = items.map(item => `
      <tr>
        <td>
          ${item.image ? 
            `<img src="${item.image}" alt="${item.name}" style="width:40px;height:40px;object-fit:cover;border-radius:0.5rem;" />` : 
            `<div style="width:40px;height:40px;background:#2d2d36;border-radius:0.5rem;display:flex;align-items:center;justify-content:center;">
              <i class="fas fa-image" style="color:#a1a1aa;"></i>
            </div>`
          }
        </td>
        <td>${item.name}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${item.description || ''}</td>
        <td>₹${item.price}</td>
        <td><span class="status ${item.available ? 'active' : 'inactive'}">${item.available ? 'Yes' : 'No'}</span></td>
        <td>
          <button class="action-btn" onclick="adminPanel.editMenuItem('${item._id}')" aria-label="Edit Menu Item">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn" onclick="adminPanel.deleteMenuItem('${item._id}')" aria-label="Delete Menu Item">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Show add menu modal
  showAddMenuModal() {
    this.resetMenuForm();
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuModal').style.display = 'flex';
    this.editingMenuId = null;
  }

  // Handle menu form submission
  async handleMenuSubmit(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('menuName').value.trim(),
      description: document.getElementById('menuDescription').value.trim(),
      price: parseFloat(document.getElementById('menuPrice').value),
      available: document.getElementById('menuAvailable').value === 'true',
      image: document.getElementById('menuPhotoPreview').src || ''
    };

    try {
      const submitBtn = document.querySelector('#menuForm button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      if (this.editingMenuId) {
        await this.apiCall(`/menu/${this.editingMenuId}`, 'PUT', formData);
        this.showSuccess('Menu item updated successfully');
      } else {
        await this.apiCall('/menu', 'POST', formData);
        this.showSuccess('Menu item added successfully');
      }

      this.closeModals();
      this.loadMenuData();
    } catch (error) {
      this.showError(error.message || 'Failed to save menu item');
    } finally {
      const submitBtn = document.querySelector('#menuForm button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save';
    }
  }

  // Edit menu item
  async editMenuItem(itemId) {
    try {
      const response = await this.apiCall('/menu');
      const item = response.find(i => i._id === itemId);
      
      if (!item) {
        this.showError('Menu item not found');
        return;
      }

      // Populate form
      document.getElementById('menuName').value = item.name;
      document.getElementById('menuDescription').value = item.description || '';
      document.getElementById('menuPrice').value = item.price;
      document.getElementById('menuAvailable').value = item.available.toString();
      
      if (item.image) {
        document.getElementById('menuPhotoPreview').src = item.image;
        document.getElementById('menuPhotoPreview').style.display = 'block';
      }

      this.editingMenuId = itemId;
      document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
      document.getElementById('menuModal').style.display = 'flex';
    } catch (error) {
      this.showError('Failed to load menu item');
    }
  }

  // Delete menu item
  async deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await this.apiCall(`/menu/${itemId}`, 'DELETE');
      this.showSuccess('Menu item deleted successfully');
      this.loadMenuData();
    } catch (error) {
      this.showError('Failed to delete menu item');
    }
  }

  // Delete user
  async deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await this.apiCall(`/auth/admin/users/${userId}`, 'DELETE');
      this.showSuccess('User deleted successfully');
      this.loadUsersData();
    } catch (error) {
      this.showError('Failed to delete user');
    }
  }

  // Delete order
  async deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await this.apiCall(`/orders/${orderId}`, 'DELETE');
      this.showSuccess('Order deleted successfully');
      this.loadOrdersData();
    } catch (error) {
      this.showError('Failed to delete order');
    }
  }

  // Reset menu form
  resetMenuForm() {
    document.getElementById('menuForm').reset();
    document.getElementById('menuPhotoPreview').style.display = 'none';
    document.getElementById('menuPhotoPreview').src = '';
    document.getElementById('menuPhotoName').textContent = '';
  }

  // Close all modals
  closeModals() {
    document.querySelectorAll('.modal, #menuModal').forEach(modal => {
      modal.style.display = 'none';
    });
  }

  // Logout
  logout() {
    localStorage.removeItem('adminToken');
    this.token = null;
    this.currentUser = null;
    this.showLogin();
    this.showSuccess('Logged out successfully');
  }

  // API call helper
  async apiCall(endpoint, method = 'GET', data = null) {
    const url = `${this.apiBase}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.token) {
      options.headers.Authorization = `Bearer ${this.token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API call failed');
    }

    return result;
  }

  // Show success message
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  // Show error message
  showError(message) {
    this.showToast(message, 'error');
  }

  // Show toast notification
  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;

    if (type === 'success') {
      toast.style.backgroundColor = '#22c55e';
    } else if (type === 'error') {
      toast.style.backgroundColor = '#ef4444';
    } else {
      toast.style.backgroundColor = '#3b82f6';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.adminPanel = new AdminPanel();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);