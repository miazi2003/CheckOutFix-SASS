const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  timezone: {
    type: String,
    trim: true,
    default: 'UTC'
  },
  dashboardLayout: {
    type: String,
    enum: ['comfortable', 'compact'],
    default: 'comfortable'
  },
  defaultAlertEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  defaultScanFrequency: {
    type: String,
    enum: ['hourly', '6h', 'daily'],
    default: 'hourly'
  },
  notifications: {
    emailAlerts: {
      type: Boolean,
      default: true
    },
    issueAlerts: {
      type: Boolean,
      default: true
    },
    performanceAlerts: {
      type: Boolean,
      default: true
    },
    weeklySummary: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
