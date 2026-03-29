const cron = require('node-cron');
const Store = require('../models/store.model');
const ScanResult = require('../models/scanResult.model');
const scanService = require('../services/scan.service');
const emailService = require('../services/email.service');

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

        console.log(`[CRON] Scanning store: ${store.url}`);

        try {
          const result = await scanService.runStoreScan(store.url);
          
          const scanRecord = new ScanResult({
            storeId: store._id,
            ...result
          });
          
          await scanRecord.save();

          if (result.status === 'broken') {
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
