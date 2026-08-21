const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/initiate', authenticate, paymentController.initiatePayment);
router.get('/:bookingId/status', authenticate, paymentController.getPaymentStatus);
router.post('/webhook', paymentController.webhook); // Public - ClickPesa inatuma hapa

module.exports = router;
