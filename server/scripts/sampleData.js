
/*### Add Sample Data Script
Create `server/scripts/sampleData.js`:

```javascript */
require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const addSampleData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    
    // Create admin user if doesn't exist
    const adminEmail = 'admin@inventory.com';
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      admin = await User.create({
        fullName: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created');
    }
    
    // Create staff user if doesn't exist
    const staffEmail = 'staff@inventory.com';
    let staff = await User.findOne({ email: staffEmail });
    
    if (!staff) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('staff123', salt);
      
      staff = await User.create({
        fullName: 'Staff User',
        email: staffEmail,
        password: hashedPassword,
        role: 'staff'
      });
      console.log('Staff user created');
    }
    
    // Add suppliers
    const suppliers = [
      {
        supplierId: 'SUP-101',
        name: 'Tech Distributors',
        contact: '9876543210',
        address: '123 Warehouse St, Mumbai'
      },
      {
        supplierId: 'SUP-102',
        name: 'Pharma Supplies Ltd',
        contact: '8765432109',
        address: '456 Medical Rd, Delhi'
      }
    ];
    
    const createdSuppliers = await Supplier.insertMany(suppliers);
    console.log('Suppliers added');
    
    // Add products
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    
    const products = [
      {
        productId: 'P-1001',
        name: 'Wireless Mouse',
        quantity: 50,
        price: 1199.99,
        supplier: createdSuppliers[0]._id,
        manufacturedDate: today,
        expiryDate: nextYear
      },
      {
        productId: 'P-1002',
        name: 'Laptop Charger',
        quantity: 25,
        price: 2499.99,
        supplier: createdSuppliers[0]._id,
        manufacturedDate: today,
        expiryDate: nextYear
      },
      {
        productId: 'P-1003',
        name: 'Vitamin C Tablets',
        quantity: 100,
        price: 199.99,
        supplier: createdSuppliers[1]._id,
        manufacturedDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        expiryDate: new Date(today.getFullYear(), today.getMonth() + 5, 1)
      }
    ];
    
    await Product.insertMany(products);
    console.log('Products added');
    
    console.log('Sample data setup complete!');
    console.log('Admin credentials: admin@inventory.com / admin123');
    console.log('Staff credentials: staff@inventory.com / staff123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error setting up sample data:', err);
    process.exit(1);
  }
};

addSampleData();