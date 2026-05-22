const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getRecommendations, getMealPlan } = require('../controllers/recommendation.controller');

router.use(protect);

router.get('/', getRecommendations);
router.post('/meal-plan', getMealPlan);

module.exports = router;
