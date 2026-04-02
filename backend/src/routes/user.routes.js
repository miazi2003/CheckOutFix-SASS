const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authGuard = require('../middleware/auth.middleware');

router.get('/:id/subscription', authGuard, userController.getSubscription);
router.get('/:id', authGuard, userController.getProfile);
router.put('/:id', authGuard, userController.updateProfile);
router.delete('/:id', authGuard, userController.deleteAccount);

module.exports = router;
