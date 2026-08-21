const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/providers', adminController.listProviders);
router.patch('/providers/:id/verify', adminController.verifyProvider);
router.patch('/providers/:id/reject', adminController.rejectProvider);

module.exports = router;
