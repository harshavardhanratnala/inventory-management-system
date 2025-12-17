require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// CRITICAL CORS CONFIGURATION - MUST BE FIRST
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Add debug middleware to see all incoming requests
app.use((req, res, next) => {
  console.log(`\n🌐 ${req.method} ${req.path}`);
  console.log('🔍 Full URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log('🍪 Cookies:', req.cookies);
  console.log('📡 Headers:', {
    origin: req.headers.origin,
    host: req.headers.host,
    'content-type': req.headers['content-type']
  });
  next();
});

// API Routes - CRITICAL: Verify these are registered correctly
app.use('/api/auth', require('./routes/auth'));
console.log('✅ Registered route: /api/auth/*');

app.use('/api/products', require('./routes/products'));
console.log('✅ Registered route: /api/products/*');

app.use('/api/suppliers', require('./routes/suppliers'));
console.log('✅ Registered route: /api/suppliers/*');

app.use('/api/stockout', require('./routes/stockout'));
console.log('✅ Registered route: /api/stockout/*');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log('🔗 API Base URL: http://localhost:5000/api');
  console.log('💡 Test product creation: curl -X POST http://localhost:5000/api/products -H "Content-Type: application/json" -d \'{"name":"Test Product", "quantity": 10}\' -b cookies.txt\n');
});