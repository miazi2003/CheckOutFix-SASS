const Store = require('../models/store.model');
const ScanResult = require('../models/scanResult.model');
const scanService = require('../services/scan.service');
const emailService = require('../services/email.service');

exports.runScan = async (req, res) => {
  try {
    const { storeId } = req.body;
    
    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Run Playwright Automation
    const result = await scanService.runStoreScan(store.url);

    // Save result to DB
    const scanRecord = new ScanResult({
      storeId: store._id,
      ...result
    });
    
    await scanRecord.save();

    // Trigger email alert if status is 'issue'
    if (result.status === 'issue') {
      await emailService.sendAlertEmail(store, result);
    }

    res.status(200).json({ message: 'Scan completed successfully', result: scanRecord });
  } catch (err) {
    console.error('Scan execution error:', err);
    res.status(500).json({ error: 'Server error while running scan' });
  }
};

exports.getScanHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    if (!require('mongoose').Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ error: 'Invalid Store ID format' });
    }

    const history = await ScanResult.find({ storeId })
                                    .sort({ createdAt: -1 })
                                    .limit(50);

    res.status(200).json({ history });
  } catch (err) {
    console.error('Get scan history error:', err);
    res.status(500).json({ error: 'Server error while fetching scan history' });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await ScanResult.find({ 
                                     status: { $in: ['issue', 'warning'] },
                                     dismissed: { $ne: true } 
                                   })
                                   .sort({ createdAt: -1 })
                                   .populate('storeId', 'url') 
                                   .limit(50);
    res.status(200).json({ alerts });
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ error: 'Server error while fetching alerts' });
  }
};

exports.clearAlerts = async (req, res) => {
  try {
    // Mark all undismissed alerts as dismissed
    await ScanResult.updateMany(
      { status: { $in: ['issue', 'warning'] }, dismissed: { $ne: true } },
      { $set: { dismissed: true } }
    );
    res.status(200).json({ message: 'All notifications cleared' });
  } catch (err) {
    console.error('Clear alerts error:', err);
    res.status(500).json({ error: 'Server error while clearing alerts' });
  }
};
