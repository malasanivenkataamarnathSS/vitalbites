// Admin API configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8080' 
  : '';

// Demo mode - set to true for testing without backend
const DEMO_MODE = false;

// Get auth token from localStorage
const getAuthToken = () => DEMO_MODE ? 'demo-admin-token' : localStorage.getItem('adminToken');

// Demo data for testing
const demoData = {
  analytics: {
    totalUsers: 1247,
    activeUsers: 892,
    totalOrders: 3456,
    deliveredOrders: 2890
  },
  recentOrders: [
    { id: '507f1f77bcf86cd799439011', userEmail: 'john.doe@email.com', status: 'delivered', total: 499, date: '2025-01-15' },
    { id: '507f1f77bcf86cd799439012', userEmail: 'jane.smith@email.com', status: 'processing', total: 299, date: '2025-01-15' },
    { id: '507f1f77bcf86cd799439013', userEmail: 'mike.johnson@email.com', status: 'cancelled', total: 199, date: '2025-01-14' },
    { id: '507f1f77bcf86cd799439014', userEmail: 'sarah.wilson@email.com', status: 'delivered', total: 399, date: '2025-01-14' },
    { id: '507f1f77bcf86cd799439015', userEmail: 'david.brown@email.com', status: 'processing', total: 599, date: '2025-01-13' }
  ],
  users: [
    { id: '1', name: 'John Doe', email: 'john.doe@email.com', role: 'user', status: 'active', createdAt: '2024-12-01' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@email.com', role: 'user', status: 'active', createdAt: '2024-12-02' },
    { id: '3', name: 'Mike Johnson', email: 'mike.johnson@email.com', role: 'user', status: 'inactive', createdAt: '2024-12-03' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@email.com', role: 'user', status: 'active', createdAt: '2024-12-04' },
    { id: '5', name: 'Admin User', email: 'admin@vitalbites.com', role: 'admin', status: 'active', createdAt: '2024-11-01' }
  ],
  orders: [
    { id: '507f1f77bcf86cd799439011', userEmail: 'john.doe@email.com', status: 'delivered', total: 499, items: [{name: 'Paneer Tikka', quantity: 2, price: 249}], deliveryAddress: 'Flat 101, Green Residency, Mumbai', date: '2025-01-15' },
    { id: '507f1f77bcf86cd799439012', userEmail: 'jane.smith@email.com', status: 'processing', total: 299, items: [{name: 'Butter Naan', quantity: 6, price: 49}], deliveryAddress: '2nd Floor, Tech Park, Pune', date: '2025-01-15' },
    { id: '507f1f77bcf86cd799439013', userEmail: 'mike.johnson@email.com', status: 'cancelled', total: 199, items: [{name: 'Masala Dosa', quantity: 1, price: 129}], deliveryAddress: 'House 23, Sector 5, Delhi', date: '2025-01-14' },
    { id: '507f1f77bcf86cd799439014', userEmail: 'sarah.wilson@email.com', status: 'delivered', total: 399, items: [{name: 'Chicken Biryani', quantity: 1, price: 399}], deliveryAddress: 'Villa 12, Palm Grove, Bangalore', date: '2025-01-14' },
    { id: '507f1f77bcf86cd799439015', userEmail: 'david.brown@email.com', status: 'processing', total: 599, items: [{name: 'Paneer Tikka', quantity: 1, price: 249}, {name: 'Dal Makhani', quantity: 1, price: 199}], deliveryAddress: 'Apartment 5B, Sky Heights, Chennai', date: '2025-01-13' }
  ],
  menuItems: [
    { id: '1', name: 'Paneer Tikka', description: 'Grilled cottage cheese cubes marinated in aromatic spices and herbs', price: 249, image: '', category: 'North Indian', available: true },
    { id: '2', name: 'Butter Naan', description: 'Soft Indian bread brushed with butter, perfect with curries', price: 49, image: '', category: 'Bread', available: true },
    { id: '3', name: 'Masala Dosa', description: 'Crispy rice crepe stuffed with spicy potato filling, served with chutneys', price: 129, image: '', category: 'South Indian', available: false },
    { id: '4', name: 'Chicken Biryani', description: 'Aromatic basmati rice cooked with tender chicken and traditional spices', price: 399, image: '', category: 'Rice', available: true },
    { id: '5', name: 'Dal Makhani', description: 'Rich and creamy black lentils slow-cooked with butter and cream', price: 199, image: '', category: 'Dal', available: true }
  ],
  addresses: [
    { id: '1', userEmail: 'john.doe@email.com', label: 'Home', address: 'Flat 101, Green Residency, Mumbai, Maharashtra - 400001', isDefault: true },
    { id: '2', userEmail: 'jane.smith@email.com', label: 'Work', address: '2nd Floor, Tech Park, Pune, Maharashtra - 411001', isDefault: false },
    { id: '3', userEmail: 'mike.johnson@email.com', label: 'Home', address: 'House 23, Sector 5, Delhi - 110001', isDefault: true },
    { id: '4', userEmail: 'sarah.wilson@email.com', label: 'Home', address: 'Villa 12, Palm Grove, Bangalore, Karnataka - 560001', isDefault: true }
  ]
};

// API call helper with error handling
const apiCall = async (url, options = {}) => {
  // Demo mode - return mock data
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    switch (url) {
      case '/api/admin/dashboard':
        return demoData;
      case '/api/admin/users':
        return demoData.users;
      case '/api/admin/orders':
        return demoData.orders;
      case '/api/admin/menu':
        return demoData.menuItems;
      case '/api/admin/addresses':
        return demoData.addresses;
      default:
        if (url.includes('/api/admin/users/') && options.method === 'PUT') {
          showToast('Demo: User updated successfully!', 'success');
          return { message: 'User updated successfully' };
        }
        if (url.includes('/api/admin/orders/') && options.method === 'PUT') {
          showToast('Demo: Order status updated successfully!', 'success');
          return { message: 'Order updated successfully' };
        }
        if (url.includes('/api/admin/menu/') && options.method === 'PUT') {
          showToast('Demo: Menu item updated successfully!', 'success');
          return { message: 'Menu item updated successfully' };
        }
        if (url.includes('/api/admin/menu/') && options.method === 'POST') {
          showToast('Demo: Menu item created successfully!', 'success');
          return { message: 'Menu item created successfully' };
        }
        if (url.includes('/api/admin/menu/') && options.method === 'DELETE') {
          showToast('Demo: Menu item deleted successfully!', 'success');
          return { message: 'Menu item deleted successfully' };
        }
        return { message: 'Demo mode - action simulated' };
    }
  }

  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/login.html?admin=true';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Show loading state
const showLoading = (element) => {
  element.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted)"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
};

// Show error state
const showError = (element, message = 'Failed to load data') => {
  element.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
};

// Toast notification system
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info'}-circle"></i> ${message}`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
};

// Check admin authentication on page load
const checkAdminAuth = () => {
  if (DEMO_MODE) {
    return true; // Allow access in demo mode
  }
  
  const token = getAuthToken();
  if (!token) {
    // Redirect to login with admin parameter
    window.location.href = '/login.html?admin=true';
    return false;
  }
  return true;
};

// Initialize admin dashboard
const initAdminDashboard = async () => {
  if (!checkAdminAuth()) return;
  
  try {
    await loadDashboardData();
    await loadUsersData();
    await loadOrdersData();
    await loadMenuData();
    await loadAddressesData();
  } catch (error) {
    console.error('Failed to initialize admin dashboard:', error);
  }
};

// Load dashboard analytics
const loadDashboardData = async () => {
  const cardsContainer = document.querySelector('.dashboard-cards');
  const ordersTableBody = document.getElementById('dashboardOrdersTable');
  
  try {
    showLoading(ordersTableBody);
    
    const data = await apiCall('/api/admin/dashboard');
    
    // Update analytics cards
    document.getElementById('userCount').textContent = data.analytics.totalUsers;
    document.getElementById('activeUserCount').textContent = data.analytics.activeUsers;
    document.getElementById('orderCount').textContent = data.analytics.totalOrders;
    document.getElementById('deliveredOrderCount').textContent = data.analytics.deliveredOrders;
    
    // Update recent orders table
    ordersTableBody.innerHTML = data.recentOrders.map(order => `
      <tr>
        <td>#${order.id.slice(-6)}</td>
        <td>${order.userEmail}</td>
        <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
        <td>₹${order.total}</td>
        <td>${order.date}</td>
      </tr>
    `).join('');
    
  } catch (error) {
    showError(ordersTableBody, 'Failed to load dashboard data');
  }
};

// Load users data
const loadUsersData = async () => {
  const usersTableBody = document.getElementById('usersTable');
  
  try {
    showLoading(usersTableBody);
    
    const users = await apiCall('/api/admin/users');
    
    usersTableBody.innerHTML = users.map(user => `
      <tr>
        <td>${user.name || 'N/A'}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td><span class="status ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
        <td>
          <button class="action-btn" aria-label="Edit User" onclick="editUser('${user.id}', '${user.name}', '${user.role}', ${user.status === 'active'})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn" aria-label="Toggle User Status" onclick="toggleUserStatus('${user.id}', ${user.status === 'active'})">
            <i class="fas fa-toggle-${user.status === 'active' ? 'on' : 'off'}"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    showError(usersTableBody, 'Failed to load users data');
  }
};

// Load orders data
const loadOrdersData = async () => {
  const ordersTableBody = document.getElementById('ordersTable');
  
  try {
    showLoading(ordersTableBody);
    
    const orders = await apiCall('/api/admin/orders');
    
    ordersTableBody.innerHTML = orders.map(order => `
      <tr>
        <td>#${order.id.slice(-6)}</td>
        <td>${order.userEmail}</td>
        <td>
          <select onchange="updateOrderStatus('${order.id}', this.value)" style="background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:0.25rem;padding:0.25rem;">
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>₹${order.total}</td>
        <td>${order.date}</td>
        <td>
          <button class="action-btn" aria-label="View Order Details" onclick="viewOrderDetails('${order.id}')">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    showError(ordersTableBody, 'Failed to load orders data');
  }
};

// Load menu data
const loadMenuData = async () => {
  const menuTableBody = document.getElementById('menuTable');
  
  try {
    showLoading(menuTableBody);
    
    const menuItems = await apiCall('/api/admin/menu');
    
    menuTableBody.innerHTML = menuItems.map(item => `
      <tr>
        <td>
          ${item.image ? 
            `<img src="${item.image}" alt="${item.name}" style="width:40px;height:40px;object-fit:cover;border-radius:0.5rem;border:1px solid #2d2d36;" />` : 
            `<span style="display:inline-block;width:40px;height:40px;border-radius:0.5rem;background:#18181b;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:#a1a1aa;font-size:1.2rem;"></i></span>`
          }
        </td>
        <td>${item.name}</td>
        <td style="max-width:220px;white-space:pre-line;overflow:hidden;text-overflow:ellipsis;">${item.description || ""}</td>
        <td>₹${item.price}</td>
        <td>
          <span class="status ${item.available ? 'active' : 'inactive'}">${item.available ? 'Yes' : 'No'}</span>
        </td>
        <td>
          <button class="action-btn" aria-label="Edit Menu Item" onclick="editMenuItem('${item.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn" aria-label="Delete Menu Item" onclick="deleteMenuItem('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    showError(menuTableBody, 'Failed to load menu data');
  }
};

// Load addresses data
const loadAddressesData = async () => {
  const addressesTableBody = document.getElementById('addressesTable');
  
  try {
    showLoading(addressesTableBody);
    
    const addresses = await apiCall('/api/admin/addresses');
    
    addressesTableBody.innerHTML = addresses.map(addr => `
      <tr>
        <td>${addr.userEmail}</td>
        <td>${addr.label}</td>
        <td>${addr.address}</td>
        <td>
          <span class="status ${addr.isDefault ? 'active' : 'inactive'}">${addr.isDefault ? 'Default' : 'Secondary'}</span>
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    showError(addressesTableBody, 'Failed to load addresses data');
  }
};

// User management functions
const editUser = async (userId, currentName, currentRole, isActive) => {
  const name = prompt('Enter user name:', currentName);
  const role = prompt('Enter user role (user/admin):', currentRole);
  
  if (name !== null && role !== null) {
    try {
      await apiCall(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          isActive
        })
      });
      
      await loadUsersData();
      showToast('User updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update user', 'error');
    }
  }
};

const toggleUserStatus = async (userId, currentStatus) => {
  try {
    await apiCall(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        isActive: !currentStatus
      })
    });
    
    await loadUsersData();
    showToast(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`, 'success');
  } catch (error) {
    showToast('Failed to update user status', 'error');
  }
};

// Order management functions
const updateOrderStatus = async (orderId, newStatus) => {
  try {
    await apiCall(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    
    showToast('Order status updated successfully!', 'success');
  } catch (error) {
    showToast('Failed to update order status', 'error');
    await loadOrdersData(); // Reload to reset the select value
  }
};

const viewOrderDetails = async (orderId) => {
  try {
    const orders = await apiCall('/api/admin/orders');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
      const details = `
Order ID: #${order.id.slice(-6)}
Customer: ${order.userEmail}
Status: ${order.status}
Total: ₹${order.total}
Date: ${order.date}
Items: ${order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
Delivery Address: ${order.deliveryAddress || 'Not provided'}
      `;
      
      // Create a modal or better formatted display instead of alert
      showToast('Order details loaded', 'info');
      // TODO: Replace with proper modal display
      console.log('Order Details:', details);
    }
  } catch (error) {
    showToast('Failed to load order details', 'error');
  }
};

// Menu management functions
let editingMenuId = null;

const editMenuItem = async (itemId) => {
  try {
    const menuItems = await apiCall('/api/admin/menu');
    const item = menuItems.find(i => i.id === itemId);
    
    if (item) {
      editingMenuId = itemId;
      document.getElementById('menuName').value = item.name;
      document.getElementById('menuDescription').value = item.description || '';
      document.getElementById('menuPrice').value = item.price;
      document.getElementById('menuAvailable').value = item.available ? 'true' : 'false';
      
      const menuPhotoPreview = document.getElementById('menuPhotoPreview');
      const menuPhotoName = document.getElementById('menuPhotoName');
      
      if (item.image) {
        menuPhotoPreview.src = item.image;
        menuPhotoPreview.style.display = 'block';
        menuPhotoName.textContent = '';
      } else {
        menuPhotoPreview.style.display = 'none';
        menuPhotoPreview.src = '';
        menuPhotoName.textContent = '';
      }
      
      document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
      document.getElementById('menuModal').style.display = 'flex';
    }
  } catch (error) {
    showToast('Failed to load menu item', 'error');
  }
};

const deleteMenuItem = async (itemId) => {
  if (confirm('Are you sure you want to delete this menu item?')) {
    try {
      await apiCall(`/api/admin/menu/${itemId}`, {
        method: 'DELETE'
      });
      
      await loadMenuData();
      showToast('Menu item deleted successfully!', 'success');
    } catch (error) {
      showToast('Failed to delete menu item', 'error');
    }
  }
};

const saveMenuItem = async (formData) => {
  try {
    const url = editingMenuId ? `/api/admin/menu/${editingMenuId}` : '/api/admin/menu';
    const method = editingMenuId ? 'PUT' : 'POST';
    
    await apiCall(url, {
      method,
      body: JSON.stringify(formData)
    });
    
    document.getElementById('menuModal').style.display = 'none';
    await loadMenuData();
    showToast(`Menu item ${editingMenuId ? 'updated' : 'created'} successfully!`, 'success');
  } catch (error) {
    showToast('Failed to save menu item', 'error');
  }
};

// Logout function
const adminLogout = () => {
  localStorage.removeItem('adminToken');
  window.location.href = '/login.html';
};

// Export functions for global access
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.saveMenuItem = saveMenuItem;
window.adminLogout = adminLogout;
window.initAdminDashboard = initAdminDashboard;