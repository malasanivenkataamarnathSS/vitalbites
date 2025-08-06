# VitalBites Admin Panel

A comprehensive admin panel for managing the VitalBites food delivery platform with secure authentication, user management, order tracking, and menu administration.

## 🌟 Features

### 🔐 Secure Authentication
- **OTP-based Login**: Admin authentication using email and OTP verification
- **Role-based Access**: Only users with admin role can access the panel
- **JWT Authentication**: Secure token-based session management
- **Auto-logout**: Automatic session expiry and logout functionality

### 📊 Dashboard & Analytics
- **Real-time Statistics**: Live metrics for users, orders, and revenue
- **User Analytics**: Total users, active users, admin count
- **Order Metrics**: Total orders, delivered orders, cancelled orders
- **Revenue Tracking**: Total revenue from completed orders
- **Recent Activity**: Latest orders and user activities

### 👥 User Management
- **User Listing**: View all registered users with pagination
- **Search Functionality**: Find users by name or email
- **Role Management**: Promote users to admin or demote to regular user
- **User Details**: View user information and registration status
- **Account Control**: Delete user accounts (with safety checks)

### 📋 Order Management
- **Order Overview**: Complete order history with filtering options
- **Status Updates**: Change order status (Processing, Confirmed, Preparing, Out for Delivery, Delivered, Cancelled)
- **Order Details**: View order items, delivery address, and customer information
- **Order Analytics**: Track order trends and performance metrics
- **Order Control**: Delete orders when necessary

### 🍽️ Menu Management
- **Item Management**: Add, edit, and delete menu items
- **Availability Control**: Toggle item availability on/off
- **Image Upload**: Support for menu item photos
- **Price Management**: Update pricing and descriptions
- **Inventory Control**: Manage menu availability and restaurant information

### 🏠 Address Management
- **Address Overview**: View all customer delivery addresses
- **User Mapping**: See which addresses belong to which users
- **Delivery Insights**: Analyze delivery patterns and locations

## 🛡️ Security Features

- **Admin Role Verification**: All endpoints require admin authentication
- **JWT Token Validation**: Secure API access with token verification
- **Input Sanitization**: Protection against XSS and injection attacks
- **Session Management**: Automatic token expiry and refresh
- **Protected Routes**: Middleware-based route protection
- **CORS Security**: Proper cross-origin request handling

## 🎨 User Interface

- **Modern Design**: Dark theme with professional appearance
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Easy-to-use sidebar navigation
- **Real-time Updates**: Live data updates without page refresh
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages and notifications
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/malasanivenkataamarnathSS/vitalbites.git
   cd vitalbites
   ```

2. **Install dependencies:**
   ```bash
   # Install all service dependencies
   npm run install-all
   # Or install individually
   cd auth-service && npm install
   cd ../menu-service && npm install
   cd ../order-service && npm install
   cd ../api-gateway && npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy example environment files
   cp .env.example .env
   
   # Configure your environment variables:
   # - MongoDB connection URLs
   # - JWT secret key
   # - SMTP credentials for OTP emails
   ```

4. **Start the services:**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d
   
   # Or start individually
   cd auth-service && npm start &
   cd menu-service && npm start &
   cd order-service && npm start &
   cd api-gateway && npm start &
   ```

5. **Create admin user:**
   ```bash
   cd scripts
   node create-admin.js
   ```

6. **Access the admin panel:**
   - Open your browser and go to `http://localhost:8080/admin.html`
   - Login with the admin email: `admin@vitalbites.com`
   - Use OTP verification to access the dashboard

### Sample Data Setup

To populate the system with sample data for testing:

```bash
cd scripts
node create-sample-menu.js    # Create sample menu items
node create-sample-orders.js  # Create sample orders
```

## 📱 Usage

### Admin Login
1. Navigate to `/admin.html`
2. Enter your admin email address
3. Click "Send OTP" 
4. Check your email for the 6-digit OTP
5. Enter the OTP and click "Login"

### Dashboard
- View real-time statistics and metrics
- Monitor recent order activity
- Track user growth and engagement

### Managing Users
- Navigate to the "Users" tab
- Search for specific users
- Change user roles or delete accounts
- View user registration details

### Managing Orders
- Go to the "Orders" tab
- Filter orders by status
- Update order status as needed
- View order details and customer information

### Managing Menu
- Access the "Menu Items" tab
- Add new items with photos and descriptions
- Edit existing items and pricing
- Toggle item availability

## 🔧 API Endpoints

### Admin Authentication
- `POST /api/auth/send-otp` - Send OTP to admin email
- `POST /api/auth/admin/login` - Verify OTP and login admin
- `GET /api/auth/verify` - Verify admin token

### User Management
- `GET /api/auth/admin/users` - Get all users (with pagination)
- `PUT /api/auth/admin/users/:id/role` - Update user role
- `DELETE /api/auth/admin/users/:id` - Delete user

### Order Management
- `GET /api/orders` - Get all orders (with filtering)
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order
- `GET /api/orders/admin/stats` - Get order statistics

### Menu Management
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Add new menu item (admin only)
- `PUT /api/menu/:id` - Update menu item (admin only)
- `DELETE /api/menu/:id` - Delete menu item (admin only)

### Analytics
- `GET /api/auth/admin/stats` - Get user statistics
- `GET /api/orders/admin/stats` - Get order analytics
- `GET /api/menu/admin/stats` - Get menu statistics

## 🛠️ Development

### Project Structure
```
vitalbites/
├── auth-service/          # Authentication and user management
├── menu-service/          # Menu item management
├── order-service/         # Order processing
├── api-gateway/           # API routing and proxy
├── frontend/              # Admin panel frontend
│   ├── admin.html         # Admin panel interface
│   └── js/admin.js        # Admin panel JavaScript
├── scripts/               # Utility scripts
│   ├── create-admin.js    # Create admin user
│   ├── create-sample-menu.js
│   └── create-sample-orders.js
└── docker-compose.yml     # Docker services configuration
```

### Adding New Features

1. **Backend**: Add new endpoints to the appropriate service
2. **Middleware**: Update admin authentication if needed
3. **Frontend**: Add new UI components and API calls
4. **Testing**: Test functionality and update documentation

### Environment Variables

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017/authdb

# JWT
JWT_SECRET=your-secret-key

# Email (for OTP)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**VitalBites Admin Panel** - Comprehensive management solution for your food delivery platform.