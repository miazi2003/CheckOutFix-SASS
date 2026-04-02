const Store = require('../models/store.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const {
  buildSubscriptionPayload,
  canCreateStore,
  ensureSubscriptionState,
  validateScanFrequency
} = require('../services/subscription.service');

exports.createStore = async (req, res) => {
  try {
    const { url, alertEmail, scanFrequency } = req.body;
    const userId = req.user?.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Invalid authenticated user' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resolvedAlertEmail = (alertEmail || user.defaultAlertEmail || user.email || '').trim().toLowerCase();
    const resolvedScanFrequency = scanFrequency || user.defaultScanFrequency || 'hourly';
    const hydratedUser = await User.findById(userId);

    ensureSubscriptionState(hydratedUser);

    if (!url || !resolvedAlertEmail) {
      return res.status(400).json({ error: 'URL and alertEmail are required' });
    }

    const frequencyCheck = validateScanFrequency(hydratedUser, resolvedScanFrequency);
    if (!frequencyCheck.allowed) {
      return res.status(403).json({
        error: frequencyCheck.reason,
        code: frequencyCheck.code,
        subscription: buildSubscriptionPayload(hydratedUser)
      });
    }

    const storeCount = await Store.countDocuments({ userId });
    const storeLimitCheck = canCreateStore(hydratedUser, storeCount);
    if (!storeLimitCheck.allowed) {
      return res.status(403).json({
        error: storeLimitCheck.reason,
        code: storeLimitCheck.code,
        subscription: buildSubscriptionPayload(hydratedUser)
      });
    }

    const newStore = new Store({
      url,
      alertEmail: resolvedAlertEmail,
      scanFrequency: resolvedScanFrequency,
      userId
    });

    await newStore.save();
    hydratedUser.markModified('subscription');
    await hydratedUser.save();

    res.status(201).json({
      message: 'Store created successfully',
      store: newStore,
      subscription: buildSubscriptionPayload(hydratedUser)
    });
  } catch (err) {
    console.error('Create store error:', err);
    res.status(500).json({ error: 'Server error while creating store' });
  }
};

exports.getStores = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Invalid authenticated user' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const claimableEmails = [user.email, user.defaultAlertEmail].filter(Boolean);
    if (claimableEmails.length > 0) {
      await Store.updateMany(
        {
          userId: { $exists: false },
          alertEmail: { $in: claimableEmails }
        },
        { $set: { userId } }
      );
    }

    const stores = await Store.find({ userId }).sort({ createdAt: -1 }).lean();

    // Attach the latest scan result to each store
    const ScanResult = require('../models/scanResult.model');

    const storesWithStatus = await Promise.all(stores.map(async (store) => {
      const latestScan = await ScanResult.findOne({ storeId: store._id })
        .sort({ createdAt: -1 })
        .lean();
      return {
        ...store,
        latestStatus: latestScan ? latestScan.status : 'no_data',
        lastChecked: latestScan ? latestScan.createdAt : store.createdAt
      };
    }));

    res.status(200).json({ stores: storesWithStatus });
  } catch (err) {
    console.error('Get stores error:', err);
    res.status(500).json({ error: 'Server error fetching stores' });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Ensure ID format is valid to prevent CastErrors
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Store ID format' });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Invalid authenticated user' });
    }

    const deletedStore = await Store.findOneAndDelete({ _id: id, userId });

    if (!deletedStore) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Cascade Delete: Also erase all scan history attached to this store
    const ScanResult = require('../models/scanResult.model');
    await ScanResult.deleteMany({ storeId: id });

    res.status(200).json({ message: 'Store deleted successfully' });
  } catch (err) {
    console.error('Delete store error:', err);
    res.status(500).json({ error: 'Server error while deleting store' });
  }
};
