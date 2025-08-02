# vitalbites

VitalBites is a comprehensive food delivery application built with a microservices architecture. It provides a seamless experience for users to browse menus, place orders, and manage their profiles, along with a powerful admin panel for complete platform management.

## Features

### User Features
- User authentication with OTP verification
- Browse and search food items
- Shopping cart functionality
- Order placement and tracking
- Profile management with multiple addresses
- Responsive design for all devices

### Admin Features
- Comprehensive admin dashboard with analytics
- User management (view, edit, activate/deactivate)
- Order management (view, update status, track delivery)
- Menu management (add, edit, delete items with photo uploads)
- Address management (view customer addresses)
- Subscription plans management (ready for future features)
- Secure role-based authentication
- Real-time data updates and notifications

## Architecture

This application follows a microservices architecture with the following services:

- **Frontend**: Static web interface served by Nginx
- **API Gateway**: Central routing and load balancing
- **Auth Service**: User authentication and authorization
- **User Service**: User profile management
- **Menu Service**: Food item and category management
- **Order Service**: Order processing and tracking
- **Cart Service**: Shopping cart operations
- **Admin Service**: Administrative operations and analytics

## Admin Panel

Access the admin panel at `/admin.html` with admin credentials. Features include:

- **Dashboard**: Key metrics and recent orders overview
- **User Management**: Complete user administration
- **Order Management**: Order tracking and status updates
- **Menu Management**: Food item administration with photo uploads
- **Address Management**: Customer delivery addresses
- **Responsive Design**: Works on all devices with dark theme

For detailed admin documentation, see [ADMIN_PANEL_DOCS.md](./ADMIN_PANEL_DOCS.md).

## Quick Start

1. Clone the repository
2. Start services with Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Create admin user:
   ```bash
   cd admin-service
   node create-admin.js
   ```
4. Access the application:
   - User Interface: `http://localhost`
   - Admin Panel: `http://localhost/admin.html`

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Container**: Docker & Docker Compose
- **Frontend**: HTML5, CSS3, JavaScript
- **Authentication**: JWT tokens
- **Email**: Nodemailer for OTP delivery