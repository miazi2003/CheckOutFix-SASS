const User = require('../models/user.model');
const Store = require('../models/store.model');
const ScanResult = require('../models/scanResult.model');
const mongoose = require('mongoose');

function isAuthorizedUser(req, id) {
  return req.user?.userId && req.user.userId === id;
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name || '',
    email: user.email,
    theme: user.theme || 'light',
    timezone: user.timezone || 'UTC',
    dashboardLayout: user.dashboardLayout || 'comfortable',
    defaultAlertEmail: user.defaultAlertEmail || '',
    defaultScanFrequency: user.defaultScanFrequency || 'hourly',
    notifications: {
      emailAlerts: user.notifications?.emailAlerts ?? true,
      issueAlerts: user.notifications?.issueAlerts ?? true,
      performanceAlerts: user.notifications?.performanceAlerts ?? true,
      weeklySummary: user.notifications?.weeklySummary ?? false
    }
  };
}

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (!isAuthorizedUser(req, id)) {
      return res.status(403).json({ error: 'You can only access your own profile' });
    }
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Update Profile and Preferences
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (!isAuthorizedUser(req, id)) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const {
      name,
      email,
      theme,
      timezone,
      dashboardLayout,
      defaultAlertEmail,
      defaultScanFrequency,
      notifications
    } = req.body;
    
    // Check if new email already exists in DB
    if (email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }

    const updateDoc = {};

    if (typeof name === 'string') {
      updateDoc.name = name.trim();
    }
    if (typeof email === 'string') {
      updateDoc.email = email.trim().toLowerCase();
    }
    if (theme) {
      updateDoc.theme = theme;
    }
    if (typeof timezone === 'string') {
      updateDoc.timezone = timezone.trim() || 'UTC';
    }
    if (dashboardLayout) {
      updateDoc.dashboardLayout = dashboardLayout;
    }
    if (typeof defaultAlertEmail === 'string') {
      updateDoc.defaultAlertEmail = defaultAlertEmail.trim().toLowerCase();
    }
    if (defaultScanFrequency) {
      updateDoc.defaultScanFrequency = defaultScanFrequency;
    }
    if (notifications && typeof notifications === 'object') {
      if (typeof notifications.emailAlerts === 'boolean') {
        updateDoc['notifications.emailAlerts'] = notifications.emailAlerts;
      }
      if (typeof notifications.issueAlerts === 'boolean') {
        updateDoc['notifications.issueAlerts'] = notifications.issueAlerts;
      }
      if (typeof notifications.performanceAlerts === 'boolean') {
        updateDoc['notifications.performanceAlerts'] = notifications.performanceAlerts;
      }
      if (typeof notifications.weeklySummary === 'boolean') {
        updateDoc['notifications.weeklySummary'] = notifications.weeklySummary;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateDoc,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ message: 'Profile updated', user: serializeUser(updatedUser) });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

// Delete Account Completely
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (!isAuthorizedUser(req, id)) {
      return res.status(403).json({ error: 'You can only delete your own profile' });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Cascade Delete: wipe out ALL stores and ALL scan results belonging to this user
    const userStores = await Store.find({ userId: id });
    const storeIds = userStores.map(s => s._id);

    await ScanResult.deleteMany({ storeId: { $in: storeIds } });
    await Store.deleteMany({ userId: id });

    res.status(200).json({ message: 'Account permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Fatal error deleting account' });
  }
};
