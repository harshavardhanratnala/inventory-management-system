const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const StockOut = require('../models/StockOut');
const Product = require('../models/Product');
const User = require('../models/User');

// @route   GET /api/stockout
// @desc    Get all stock out records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const records = await StockOut.find()
      .populate('product', 'name')
      .populate('recordedBy', 'fullName')
      .sort({ timestamp: -1 });
    
    res.json(records);
  } catch (err) {
    console.error('Stock out records fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/stockout
// @desc    Create a new stock out record
// @access  Private
router.post('/', auth, async (req, res) => {
  const { product, quantity, timestamp } = req.body;

  try {
    // Verify product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(400).json({ error: 'Invalid product' });
    }

    // Create stock out record
    const stockOut = new StockOut({
      product,
      quantity,
      timestamp: timestamp || Date.now(),
      recordedBy: req.user.id
    });

    await stockOut.save();
    res.status(201).json(stockOut);
  } catch (err) {
    console.error('Stock out record creation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;