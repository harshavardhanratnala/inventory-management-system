// server/routes/products.js
const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const Product = require('../models/Product');

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /api/products request received');
    const products = await Product.find().populate('supplier', 'name');
    console.log(`✅ Returned ${products.length} products`);
    res.json(products);
  } catch (err) {
    console.error('GET /api/products error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
});

// @route   POST /api/products
// @desc    Add a new product
// @access  Private (Admin only)
router.post('/', [auth, admin], async (req, res) => {
  const { 
    productId, 
    name, 
    quantity, 
    price, 
    supplier, 
    manufacturedDate, 
    expiryDate,
    unit
  } = req.body;

  try {
    console.log('POST /api/products request received:', {
      productId,
      name,
      quantity,
      price,
      supplier,
      manufacturedDate,
      expiryDate,
      unit
    });

    // Create product with optional expiryDate
    const newProduct = new Product({
      productId,
      name,
      quantity,
      price,
      supplier,
      manufacturedDate,
      ...(expiryDate && { expiryDate }),
      unit
    });

    const product = await newProduct.save();
    console.log('✅ Product created successfully:', product);
    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/products error:', {
      message: err.message,
      stack: err.stack
    });
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: err.message,
        fields: Object.keys(err.errors || {})
      });
    }
    
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
});

// @route   PUT /api/products/:id/stockout
// @desc    Record stock out (decrement quantity)
// @access  Private
router.put('/:id/stockout', auth, async (req, res) => {
  const { quantity } = req.body;
  
  try {
    console.log('Stock out request:', {
      userId: req.user.id,
      productId: req.params.id,
      quantity,
      role: req.user.role
    });
    
    // Validate quantity
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        msg: 'Quantity must be a positive number' 
      });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.error('Product not found:', req.params.id);
      return res.status(404).json({ 
        msg: 'Product not found' 
      });
    }
    
    // Convert to numbers to prevent type issues
    const currentQuantity = Number(product.quantity);
    const requestedQuantity = Number(quantity);
    
    console.log('Stock check:', {
      currentQuantity,
      requestedQuantity
    });
    
    // Prevent negative stock
    if (currentQuantity < requestedQuantity) {
      return res.status(400).json({ 
        msg: `Insufficient stock! Only ${currentQuantity} available` 
      });
    }
    
    // Update quantity
    product.quantity = currentQuantity - requestedQuantity;
    
    // Update status if needed
    if (product.quantity === 0) {
      product.status = 'out-of-stock';
    } else if (product.quantity < 10) {
      product.status = 'low-stock';
    }
    
    await product.save();
    
    console.log('Stock out successful:', {
      productId: product._id,
      newQuantity: product.quantity
    });
    
    res.json(product);
  } catch (err) {
    console.error('STOCK OUT ERROR DETAILS:', {
      message: err.message,
      stack: err.stack,
      productId: req.params.id,
      quantity: req.body.quantity
    });
    
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
});

// @route   PUT /api/products/:id/obsolete
// @desc    Mark product as obsolete
// @access  Private (Admin only)
router.put('/:id/obsolete', [auth, admin], async (req, res) => {
  try {
    console.log('Marking product as obsolete:', req.params.id);
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    product.status = 'obsolete';
    await product.save();
    console.log('Product marked as obsolete:', product);

    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/obsolete
// @desc    Get all obsolete products
// @access  Private (Admin only)
router.get('/obsolete', [auth, admin], async (req, res) => {
  try {
    console.log('Fetching obsolete products');
    const products = await Product.find({ status: 'obsolete' }).populate('supplier', 'name');
    console.log(`Found ${products.length} obsolete products`);
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/products/:id/restore
// @desc    Restore product from obsolete
// @access  Private (Admin only)
router.put('/:id/restore', [auth, admin], async (req, res) => {
  try {
    console.log('Attempting to restore product:', req.params.id);
    
    let product = await Product.findById(req.params.id);
    if (!product) {
      console.error('Restore failed: Product not found', req.params.id);
      return res.status(404).json({ 
        msg: 'Product not found' 
      });
    }

    console.log('Found product to restore:', {
      id: product._id,
      name: product.name,
      currentStatus: product.status,
      quantity: product.quantity
    });

    // Determine appropriate status based on quantity
    let newStatus;
    if (product.quantity === 0) {
      newStatus = 'out-of-stock';
    } else if (product.quantity < 10) {
      newStatus = 'low-stock';
    } else {
      newStatus = 'active';
    }
    
    console.log('Setting new status:', newStatus);
    
    // Update the product status
    product.status = newStatus;
    
    // Save the product
    const updatedProduct = await product.save();
    
    console.log('Product restored successfully:', {
      productId: updatedProduct._id,
      name: updatedProduct.name,
      newStatus: updatedProduct.status
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('RESTORE ERROR DETAILS:', {
      message: err.message,
      stack: err.stack,
      productId: req.params.id,
      errorType: err.name,
      validationErrors: err.errors
    });
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: err.message,
        fields: Object.keys(err.errors || {})
      });
    }
    
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
});

module.exports = router;