const mongoose = require('mongoose');

const scanResultSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  status: {
    type: String,
    enum: ['healthy', 'warning', 'issue'],
    required: true
  },
  loadTime: {
    type: Number,
    required: true
  },
  productPage: {
    type: Boolean,
    default: false
  },
  addToCart: {
    type: Boolean,
    default: false
  },
  checkoutPage: {
    type: Boolean,
    default: false
  },
  issues: [{
    type: String
  }],
  dismissed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ScanResult', scanResultSchema);
