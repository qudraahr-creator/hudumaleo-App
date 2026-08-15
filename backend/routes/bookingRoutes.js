const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('customer'), bookingController.createBooking);
router.get('/mine', authenticate, bookingController.myBookings);
router.patch('/:id/status', authenticate, bookingController.updateBookingStatus);

module.exports = router;
