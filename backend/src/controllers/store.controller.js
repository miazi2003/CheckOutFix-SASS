const Store = require('../models/store.model');

exports.createStore = async (req, res) => {
  try {
    const { url, alertEmail, scanFrequency } = req.body;
    
    // In a real app with JWT auth, req.user would hold the userId
    // const userId = req.user._id;

    if (!url || !alertEmail) {
      return res.status(400).json({ error: 'URL and alertEmail are required' });
    }

    const newStore = new Store({
      url,
      alertEmail,
      scanFrequency: scanFrequency || 'hourly'
      // userId
    });

    await newStore.save();
    res.status(201).json({ message: 'Store created successfully', store: newStore });
  } catch (err) {
    console.error('Create store error:', err);
    res.status(500).json({ error: 'Server error while creating store' });
  }
};

exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 }).lean();
    
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
    
    // Ensure ID format is valid to prevent CastErrors
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Store ID format' });
    }

    const deletedStore = await Store.findByIdAndDelete(id);
    
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
