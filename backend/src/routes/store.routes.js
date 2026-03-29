const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const authGuard = require('../middleware/auth.middleware');

router.post('/', authGuard, storeController.createStore);
router.get('/', authGuard, storeController.getStores);
router.delete('/:id', authGuard, storeController.deleteStore);

module.exports = router;
