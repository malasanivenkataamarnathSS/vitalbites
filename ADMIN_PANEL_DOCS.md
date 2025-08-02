# VitalBites Admin Panel Documentation

## Overview
The VitalBites Admin Panel is a comprehensive administrative interface that allows administrators to manage all aspects of the food delivery platform.

## Features

### 1. Dashboard Overview
- **Analytics Cards**: Display key metrics including Total Users, Active Users, Total Orders, and Delivered Orders
- **Recent Orders Table**: Shows the latest orders with status tracking and order details
- **Real-time Data**: All metrics are updated in real-time from the backend services

### 2. User Management
- **User Listing**: View all registered users with their details (name, email, role, status)
- **User Actions**: Edit user information and toggle user activation status
- **Role Management**: Manage admin and regular user permissions
- **Status Tracking**: Monitor active/inactive user accounts

### 3. Order Management
- **Complete Order History**: View all orders with comprehensive details
- **Status Updates**: Change order status (Processing, Delivered, Cancelled) directly from the interface
- **Order Details**: View full order information including items and delivery addresses
- **Order Actions**: Quick actions for order processing

### 4. Menu Management
- **Menu Items Display**: List all available food items with photos, descriptions, and pricing
- **Add/Edit Items**: Modal-based form to add new menu items or edit existing ones
- **Availability Toggle**: Easily manage item availability status
- **Photo Upload**: Support for uploading and managing item images
- **Pricing Management**: Update item prices with validation

### 5. Address Management
- **Customer Addresses**: View and manage all customer delivery addresses
- **Address Details**: Complete address information with labels (Home, Work, etc.)
- **Default Settings**: Track which addresses are set as default for users

### 6. Subscription Plans (Future Feature)
- **Static Display**: Currently shows sample subscription plans
- **Ready for Enhancement**: Structure in place for future subscription management features

## Technical Implementation

### Architecture
- **Frontend**: Responsive HTML/CSS/JavaScript interface
- **Backend**: Node.js microservice (admin-service) with Express.js
- **Database**: MongoDB integration across multiple databases (auth, user, order, menu, cart)
- **API Gateway**: Centralized routing for all admin operations
- **Authentication**: JWT-based admin authentication with role verification

### Security Features
- **Admin Authentication**: Role-based access control ensuring only admin users can access the panel
- **Token Validation**: Secure JWT token validation for all API calls
- **Rate Limiting**: Protection against abuse with request rate limiting
- **Input Validation**: Server-side validation for all data inputs

### UI/UX Enhancements
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme**: Professional dark theme optimized for admin interfaces
- **Loading States**: Smooth loading indicators and skeleton screens
- **Error Handling**: User-friendly error messages and retry mechanisms
- **Toast Notifications**: Real-time feedback for all actions
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## Authentication & Access

### Admin Login Process
1. Navigate to `/admin.html` - automatically redirects to admin login
2. Enter admin email address
3. Receive OTP via email
4. Verify OTP to access admin dashboard
5. Role verification ensures only admin users gain access

### Admin User Creation
```javascript
// Use the provided script to create admin user
cd admin-service
node create-admin.js
```

Default admin credentials:
- Email: `admin@vitalbites.com`
- Uses OTP-based authentication (same as regular users)

## API Endpoints

### Dashboard
- `GET /api/admin/dashboard` - Get analytics and recent orders

### User Management
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user details

### Order Management
- `GET /api/admin/orders` - List all orders
- `PUT /api/admin/orders/:id` - Update order status

### Menu Management
- `GET /api/admin/menu` - List all menu items
- `POST /api/admin/menu` - Create new menu item
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item

### Address Management
- `GET /api/admin/addresses` - List all user addresses

## Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB
- Docker & Docker Compose

### Installation
1. Clone the repository
2. Install dependencies for all services
3. Set up environment variables
4. Start services with Docker Compose

```bash
# Start all services
docker-compose up -d

# Create admin user
cd admin-service
node create-admin.js
```

### Demo Mode
For testing without a backend connection, enable demo mode in `admin-api.js`:
```javascript
const DEMO_MODE = true;
```

## File Structure
```
admin-service/
├── index.js           # Main admin service
├── package.json       # Dependencies
├── Dockerfile         # Container configuration
└── create-admin.js    # Admin user creation script

frontend/
├── admin.html                # Main admin interface
├── admin-enhancements.css    # Enhanced styling
└── js/
    └── admin-api.js          # Admin API client
```

## Future Enhancements
- Real-time notifications for new orders
- Advanced analytics and reporting
- Subscription plan management
- Bulk operations for users and orders
- Export functionality for data
- Advanced filtering and search capabilities
- Multi-language support
- Audit logging for admin actions

## Support
For technical issues or feature requests, please refer to the main project documentation or contact the development team.