const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scan.controller');
const authGuard = require('../middleware/auth.middleware');

router.post('/', authGuard, scanController.runScan);
router.get('/alerts', authGuard, scanController.getAlerts);
router.get('/:storeId', authGuard, scanController.getScanHistory);

module.exports = router;
