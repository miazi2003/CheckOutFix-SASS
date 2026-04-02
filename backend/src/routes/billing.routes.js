const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const authGuard = require('../middleware/auth.middleware');

router.get('/status', authGuard, billingController.getBillingStatus);
router.post('/checkout-session', authGuard, billingController.createCheckoutSession);
router.post('/portal-session', authGuard, billingController.createPortalSession);

module.exports = router;
