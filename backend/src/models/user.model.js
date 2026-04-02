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
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['inactive', 'trialing', 'active', 'past_due', 'canceled'],
      default: 'inactive'
    },
    scansUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    scanLimit: {
      type: Number,
      default: 5,
      min: 0
    },
    resetAt: {
      type: Date,
      default: () => {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      }
    },
    storesLimit: {
      type: Number,
      default: 1,
      min: 1
    },
    stripeCustomerId: {
      type: String,
      trim: true,
      default: ''
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
      default: ''
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      default: null
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
