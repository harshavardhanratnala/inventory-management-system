// server/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  manufacturedDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: false  // Make it optional
  },
  unit: {
    type: String,
    required: true,
    enum: ['pieces', 'kg'],
    default: 'pieces'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'low-stock', 'out-of-stock', 'obsolete'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);