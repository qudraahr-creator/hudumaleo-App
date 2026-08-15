const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', providerController.listProviders);
router.get('/:id', providerController.getProvider);

router.put('/me/profile', authenticate, authorize('provider'), providerController.updateMyProviderProfile);
router.post('/me/services', authenticate, authorize('provider'), providerController.addMyService);
router.post('/me/location', authenticate, authorize('provider'), providerController.setMyLocation);

module.exports = router;
