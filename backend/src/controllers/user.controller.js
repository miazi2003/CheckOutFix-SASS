const User = require('../models/user.model');
const Store = require('../models/store.model');
const ScanResult = require('../models/scanResult.model');

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Update Profile (Email and Theme)
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, theme } = req.body;
    
    // Check if new email already exists in DB
    if (email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...(email && { email }), ...(theme && { theme }) },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

// Delete Account Completely
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
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
