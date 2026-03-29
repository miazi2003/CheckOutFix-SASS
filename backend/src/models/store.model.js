const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for now if we want to allow guest stores, but set to required normally
  },
  url: {
    type: String,
    required: [true, 'Store URL is required'],
    trim: true
  },
  alertEmail: {
    type: String,
    required: [true, 'Alert Email is required'],
    trim: true,
    lowercase: true
  },
  scanFrequency: {
    type: String,
    enum: ['hourly', '6h', 'daily'],
    default: 'hourly'
  }
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
