const jwt = require('jsonwebtoken');

// Main authentication middleware
const auth = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. Please log in.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(400).json({ 
      error: 'Invalid token. Please log in again.' 
    });
  }
};

// Admin role protection
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required' 
    });
  }
  next();
};

module.exports = { auth, admin }; // CRITICAL: EXPORT AS OBJECT