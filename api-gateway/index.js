require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

// Proxy rules
app.use('/api/auth', createProxyMiddleware({ target: 'http://auth-service:5000', changeOrigin: true, pathRewrite: { '^/api/auth': '/api/auth' } }));
app.use('/api/menu', createProxyMiddleware({ target: 'http://menu-service:5001', changeOrigin: true, pathRewrite: { '^/api/menu': '/api/menu' } }));
app.use('/api/orders', createProxyMiddleware({ target: 'http://order-service:5002', changeOrigin: true, pathRewrite: { '^/api/orders': '/api/orders' } }));
app.use('/api/user', createProxyMiddleware({ target: 'http://user-service:5003', changeOrigin: true, pathRewrite: { '^/api/user': '/api/user' } }));

app.listen(8080, () => console.log('API Gateway listening on 8080'));