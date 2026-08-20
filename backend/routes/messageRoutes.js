const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.get('/:bookingId', authenticate, messageController.getMessages);

module.exports = router;
