const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/categories', serviceController.listCategories);
router.get('/services', serviceController.listServices);

module.exports = router;
