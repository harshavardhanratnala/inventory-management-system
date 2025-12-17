require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const addObsoleteProducts = async () => {
  try {
    await connectDB();
    
    // Find a supplier
    const supplier = await Supplier.findOne();
    if (!supplier) {
      console.error('No suppliers found. Please add a supplier first.');
      process.exit(1);
    }
    
    const today = new Date();
    
    // Add expired products
    const expiredProducts = [
      {
        productId: 'P-9001',
        name: 'Expired Medicine Batch',
        quantity: 0,
        price: 199.99,
        supplier: supplier._id,
        manufacturedDate: new Date(today.getFullYear(), today.getMonth() - 6, 1),
        expiryDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        status: 'obsolete'
      },
      {
        productId: 'P-9002',
        name: 'Old Electronic Components',
        quantity: 5,
        price: 499.99,
        supplier: supplier._id,
        manufacturedDate: new Date(today.getFullYear() - 2, 0, 1),
        expiryDate: new Date(today.getFullYear() - 1, 0, 1),
        status: 'obsolete'
      }
    ];
    
    for (const product of expiredProducts) {
      await Product.create(product);
      console.log(`Added obsolete product: ${product.name}`);
    }
    
    console.log('All obsolete products added successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error adding obsolete products:', err);
    process.exit(1);
  }
};

addObsoleteProducts();