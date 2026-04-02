const cron = require('node-cron');
const Store = require('../models/store.model');
const ScanResult = require('../models/scanResult.model');
const User = require('../models/user.model');
const scanService = require('../services/scan.service');
const emailService = require('../services/email.service');
const { canRunScan, recordSuccessfulScan, validateScanFrequency } = require('../services/subscription.service');

// Map frequency constants to cron-readable intervals logic
const shouldRunNow = (frequency, currentHour) => {
  if (frequency === 'hourly') return true;
  if (frequency === '6h' && currentHour % 6 === 0) return true;
  if (frequency === 'daily' && currentHour === 0) return true; // Midnight UTC
  return false;
};

// Run cron job at the start of every hour
exports.initCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Starting scheduled store scans...', new Date().toISOString());
    const currentHour = new Date().getUTCHours();

    try {
      const stores = await Store.find();

      for (const store of stores) {
        if (!shouldRunNow(store.scanFrequency, currentHour)) {
          continue;
        }

        if (!store.userId) {
          continue;
        }

        const user = await User.findById(store.userId);
        if (!user) {
          continue;
        }

        const frequencyCheck = validateScanFrequency(user, store.scanFrequency);
        if (!frequencyCheck.allowed) {
          continue;
        }

        const scanAccess = canRunScan(user);
        if (!scanAccess.allowed) {
          continue;
        }

        console.log(`[CRON] Scanning store: ${store.url}`);

        try {
          const result = await scanService.runStoreScan(store.url);
          
          const scanRecord = new ScanResult({
            storeId: store._id,
            ...result
          });
          
          await scanRecord.save();
          recordSuccessfulScan(user);
          await user.save();

          if (result.status === 'issue') {
             await emailService.sendAlertEmail(store, result);
          }
        } catch (scanErr) {
          console.error(`[CRON] Error scanning store ${store.url}:`, scanErr.message);
        }
      }
      console.log('[CRON] Scheduled scans completed.');
    } catch (err) {
      console.error('[CRON] Global Job Error:', err.message);
    }
  });

  console.log('Cron jobs initialized.');
};
