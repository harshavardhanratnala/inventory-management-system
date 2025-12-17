const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const Supplier = require('../models/Supplier');

// @route   GET /api/suppliers
// @desc    Get all suppliers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    console.error('Suppliers fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/suppliers
// @desc    Add new supplier
// @access  Private (Admin only)
router.post('/', [auth, admin], async (req, res) => {
  const { supplierId, name, contact, address } = req.body;

  try {
    // Validate required fields
    if (!supplierId || !name || !contact || !address) {
      return res.status(400).json({ 
        error: 'All fields (supplierId, name, contact, address) are required' 
      });
    }

    // Check if supplier ID already exists
    let supplier = await Supplier.findOne({ supplierId });
    if (supplier) {
      return res.status(400).json({ 
        error: 'Supplier ID already exists' 
      });
    }

    // Create new supplier
    supplier = new Supplier({
      supplierId,
      name,
      contact,
      address
    });

    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    console.error('Supplier creation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;