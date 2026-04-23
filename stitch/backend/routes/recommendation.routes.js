const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getRecommendations } = require('../controllers/recommendation.controller');

router.use(protect);

router.get('/', getRecommendations);

module.exports = router;
