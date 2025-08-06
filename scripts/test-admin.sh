#!/bin/bash

# VitalBites Admin Panel Test Script

echo "Starting VitalBites Admin Panel Test..."

# Start MongoDB in background
echo "Starting MongoDB..."
mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data

# Wait for MongoDB to start
sleep 3

# Start Auth Service
echo "Starting Auth Service..."
cd /home/runner/work/vitalbites/vitalbites/auth-service
MONGO_URL=mongodb://localhost:27017/authdb JWT_SECRET=supersecret node index.js &
AUTH_PID=$!

# Start Menu Service
echo "Starting Menu Service..."
cd /home/runner/work/vitalbites/vitalbites/menu-service
MONGO_URL=mongodb://localhost:27017/menudb node index.js &
MENU_PID=$!

# Start Order Service  
echo "Starting Order Service..."
cd /home/runner/work/vitalbites/vitalbites/order-service
MONGO_URL=mongodb://localhost:27017/orderdb node index.js &
ORDER_PID=$!

# Start API Gateway
echo "Starting API Gateway..."
cd /home/runner/work/vitalbites/vitalbites/api-gateway
NODE_ENV=development node index.js &
GATEWAY_PID=$!

echo "All services started!"
echo "Auth Service PID: $AUTH_PID"
echo "Menu Service PID: $MENU_PID"
echo "Order Service PID: $ORDER_PID"
echo "API Gateway PID: $GATEWAY_PID"

# Wait a bit for services to start
sleep 5

# Create admin user
echo "Creating admin user..."
cd /home/runner/work/vitalbites/vitalbites/scripts
MONGO_URL=mongodb://localhost:27017/authdb node create-admin.js

# Create sample data
echo "Creating sample menu items..."
MONGO_URL=mongodb://localhost:27017/menudb node create-sample-menu.js

echo "Creating sample orders..."  
MONGO_URL=mongodb://localhost:27017/orderdb node create-sample-orders.js

echo ""
echo "=== VitalBites Admin Panel Ready! ==="
echo ""
echo "Admin Panel: http://localhost:8080/admin.html"
echo "Login Email: admin@vitalbites.com"
echo ""
echo "To stop all services, run:"
echo "kill $AUTH_PID $MENU_PID $ORDER_PID $GATEWAY_PID"
echo ""

# Keep script running
read -p "Press Enter to stop all services..."

# Cleanup
echo "Stopping services..."
kill $AUTH_PID $MENU_PID $ORDER_PID $GATEWAY_PID 2>/dev/null
pkill mongod 2>/dev/null

echo "All services stopped."