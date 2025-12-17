const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

// Helper function with CORRECT cookie settings for development
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: false, // MUST be false for HTTP development
    sameSite: 'lax', // Critical for development
    maxAge: 3600000, // 1 hour
    path: '/' // Must be root path
  };
};

// @route   POST /api/auth/register
// @desc    Register new user
router.post('/register', async (req, res) => {
  console.log('📝 Registration request received:', {
    body: req.body,
    ip: req.ip
  });
  
  const { fullName, email, password, role } = req.body;
  
  try {
    // Validation
    if (!fullName || !email || !password) {
      console.error('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check existing user
    let user = await User.findOne({ email });
    if (user) {
      console.error('Registration failed: User already exists', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({ fullName, email, password, role });
    await user.save();

    // Generate JWT
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie with CORRECT settings (THIS IS CRITICAL)
    const cookieOptions = getCookieOptions();
    console.log('🍪 Setting authentication cookie after registration:', cookieOptions);
    res.cookie('token', token, cookieOptions).json({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error('Registration error details:', {
      message: err.message,
      stack: err.stack,
      email: req.body.email
    });
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Generate JWT
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie with CORRECT settings
    const cookieOptions = getCookieOptions();
    console.log('🍪 Setting cookie with options:', cookieOptions);
    res.cookie('token', token, cookieOptions).json({
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error('Login error details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Verify session
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    console.log('✅ Session verified for user:', user.email);
    res.json(user);
  } catch (err) {
    console.error('Session verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Clear auth cookie
router.post('/logout', (req, res) => {
  const cookieOptions = getCookieOptions();
  console.log('🧹 Clearing cookie with options:', cookieOptions);
  res.clearCookie('token', cookieOptions).json({ message: 'Logged out successfully' });
});

module.exports = router;