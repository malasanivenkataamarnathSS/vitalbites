// Real-time Admin Dashboard JavaScript
class AdminDashboard {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentView = 'dashboard';
    this.charts = {};
    this.data = {};
    
    this.init();
  }

  init() {
    this.setupSocketConnection();
    this.setupEventListeners();
    this.loadDashboardData();
    this.setupCharts();
    
    // Load dashboard by default
    this.showView('dashboard');
  }

  setupSocketConnection() {
    try {
      // Connect to Socket.io server
      this.socket = io('http://localhost:5005', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      this.socket.on('connect', () => {
        console.log('Connected to real-time server');
        this.isConnected = true;
        this.updateConnectionStatus(true);
        
        // Authenticate as admin
        const token = localStorage.getItem('adminToken');
        if (token) {
          this.socket.emit('authenticate', token);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from real-time server');
        this.isConnected = false;
        this.updateConnectionStatus(false);
      });

      this.socket.on('authenticated', (data) => {
        console.log('Authenticated with server:', data);
        // Subscribe to admin dashboard updates
        this.socket.emit('subscribe_admin_dashboard');
      });

      this.socket.on('authentication_error', (error) => {
        console.error('Authentication failed:', error);
        this.showNotification('Authentication failed', 'error');
      });

      // Real-time order updates
      this.socket.on('admin_order_update', (data) => {
        this.handleOrderUpdate(data);
      });

      // Real-time admin notifications
      this.socket.on('admin_notification', (notification) => {
        this.showNotification(notification.message, notification.type);
      });

      // Real-time dashboard metrics
      this.socket.on('dashboard_metrics_update', (metrics) => {
        this.updateDashboardMetrics(metrics);
      });

    } catch (error) {
      console.error('Failed to setup Socket.io connection:', error);
    }
  }

  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav button[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.showView(view);
      });
    });

    // Refresh data button
    document.getElementById('refreshData')?.addEventListener('click', () => {
      this.loadDashboardData();
    });

    // Export data button
    document.getElementById('exportData')?.addEventListener('click', () => {
      this.exportDashboardData();
    });

    // Real-time toggle
    document.getElementById('realtimeToggle')?.addEventListener('change', (e) => {
      if (e.target.checked && !this.isConnected) {
        this.setupSocketConnection();
      } else if (!e.target.checked && this.isConnected) {
        this.socket.disconnect();
      }
    });
  }

  async loadDashboardData() {
    try {
      this.showLoading(true);
      
      const response = await fetch('/api/admin/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      this.data = await response.json();
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showNotification('Failed to load dashboard data', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  updateDashboard() {
    if (!this.data.success) return;

    const { stats, orderStatusDistribution, topSellingItems, recentOrders } = this.data.data;

    // Update stat cards
    this.updateStatCard('total-users', stats.users.total, stats.users.growth + '%');
    this.updateStatCard('total-orders', stats.orders.total, stats.orders.growth + '%');
    this.updateStatCard('total-revenue', '$' + stats.revenue.total.toFixed(2), stats.revenue.growth + '%');
    this.updateStatCard('active-menu-items', stats.menu.activeItems, '');

    // Update charts
    this.updateOrderStatusChart(orderStatusDistribution);
    this.updateTopSellingChart(topSellingItems);
    
    // Update recent orders
    this.updateRecentOrders(recentOrders);
  }

  updateStatCard(id, value, growth) {
    const card = document.getElementById(id);
    if (card) {
      const valueEl = card.querySelector('.stat-value');
      const growthEl = card.querySelector('.stat-growth');
      
      if (valueEl) valueEl.textContent = value;
      if (growthEl) {
        growthEl.textContent = growth;
        growthEl.className = `stat-growth ${parseFloat(growth) >= 0 ? 'positive' : 'negative'}`;
      }
    }
  }

  setupCharts() {
    // Setup Chart.js charts
    if (typeof Chart !== 'undefined') {
      // Order Status Pie Chart
      const orderStatusCtx = document.getElementById('orderStatusChart');
      if (orderStatusCtx) {
        this.charts.orderStatus = new Chart(orderStatusCtx, {
          type: 'doughnut',
          data: {
            labels: [],
            datasets: [{
              data: [],
              backgroundColor: ['#22c55e', '#f59e42', '#ef4444', '#3b82f6'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#f3f4f6' }
              }
            }
          }
        });
      }

      // Top Selling Items Bar Chart
      const topSellingCtx = document.getElementById('topSellingChart');
      if (topSellingCtx) {
        this.charts.topSelling = new Chart(topSellingCtx, {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              label: 'Quantity Sold',
              data: [],
              backgroundColor: '#ff8800',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { 
                ticks: { color: '#f3f4f6' },
                grid: { color: '#2d2d36' }
              },
              y: { 
                ticks: { color: '#f3f4f6' },
                grid: { color: '#2d2d36' }
              }
            }
          }
        });
      }
    }
  }

  updateOrderStatusChart(data) {
    if (this.charts.orderStatus && data) {
      const labels = data.map(item => item._id);
      const values = data.map(item => item.count);
      
      this.charts.orderStatus.data.labels = labels;
      this.charts.orderStatus.data.datasets[0].data = values;
      this.charts.orderStatus.update();
    }
  }

  updateTopSellingChart(data) {
    if (this.charts.topSelling && data) {
      const labels = data.map(item => `Item ${item._id.slice(-6)}`);
      const values = data.map(item => item.totalSold);
      
      this.charts.topSelling.data.labels = labels;
      this.charts.topSelling.data.datasets[0].data = values;
      this.charts.topSelling.update();
    }
  }

  updateRecentOrders(orders) {
    const container = document.getElementById('recentOrders');
    if (!container || !orders) return;

    container.innerHTML = orders.map(order => `
      <div class="order-item" data-order-id="${order._id}">
        <div class="order-info">
          <div class="order-id">#${order.orderNumber || order._id.slice(-6)}</div>
          <div class="order-amount">$${order.totalAmount?.toFixed(2) || '0.00'}</div>
        </div>
        <div class="order-status status-${order.status}">
          ${order.status || 'pending'}
        </div>
        <div class="order-time">
          ${new Date(order.createdAt).toLocaleTimeString()}
        </div>
      </div>
    `).join('');
  }

  handleOrderUpdate(data) {
    console.log('Real-time order update:', data);
    
    // Update specific order in the list
    const orderElement = document.querySelector(`[data-order-id="${data.orderId}"]`);
    if (orderElement) {
      const statusElement = orderElement.querySelector('.order-status');
      if (statusElement) {
        statusElement.className = `order-status status-${data.status}`;
        statusElement.textContent = data.status;
      }
    }

    // Show notification
    this.showNotification(`Order #${data.orderNumber || data.orderId.slice(-6)} updated to ${data.status}`, 'info');
    
    // Refresh dashboard data for updated stats
    this.loadDashboardData();
  }

  updateDashboardMetrics(metrics) {
    console.log('Real-time metrics update:', metrics);
    // Update any real-time metrics display
  }

  showView(viewName) {
    // Hide all views
    document.querySelectorAll('.content-view').forEach(view => {
      view.style.display = 'none';
    });

    // Show selected view
    const targetView = document.getElementById(viewName + 'View');
    if (targetView) {
      targetView.style.display = 'block';
    }

    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Update header title
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
      headerTitle.textContent = this.getViewTitle(viewName);
    }

    this.currentView = viewName;

    // Load view-specific data
    this.loadViewData(viewName);
  }

  getViewTitle(viewName) {
    const titles = {
      dashboard: 'Dashboard Overview',
      users: 'User Management',
      menu: 'Menu Management',
      orders: 'Order Management',
      analytics: 'Analytics & Reports',
      system: 'System Settings'
    };
    return titles[viewName] || 'Admin Dashboard';
  }

  async loadViewData(viewName) {
    // Load specific data for each view
    switch (viewName) {
      case 'users':
        await this.loadUsersData();
        break;
      case 'menu':
        await this.loadMenuData();
        break;
      case 'orders':
        await this.loadOrdersData();
        break;
      case 'analytics':
        await this.loadAnalyticsData();
        break;
    }
  }

  async loadUsersData() {
    // Implementation for loading users data
    console.log('Loading users data...');
  }

  async loadMenuData() {
    // Implementation for loading menu data
    console.log('Loading menu data...');
  }

  async loadOrdersData() {
    // Implementation for loading orders data
    console.log('Loading orders data...');
  }

  async loadAnalyticsData() {
    // Implementation for loading analytics data
    console.log('Loading analytics data...');
  }

  showLoading(show) {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

  updateConnectionStatus(connected) {
    const indicator = document.getElementById('connectionStatus');
    if (indicator) {
      indicator.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
      indicator.textContent = connected ? 'Connected' : 'Disconnected';
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">&times;</button>
    `;

    // Add to container
    const container = document.getElementById('notificationContainer') || this.createNotificationContainer();
    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  async exportDashboardData() {
    try {
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'dashboard',
          dateRange: 'last30days'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vitalbites-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Dashboard data exported successfully', 'success');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('Failed to export data', 'error');
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.adminDashboard = new AdminDashboard();
});

// Handle service worker for PWA features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}