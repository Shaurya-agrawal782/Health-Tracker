const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  predict,
  getPrediction,
  getHistory
} = require('../controllers/predict.controller');

router.use(protect); // All routes require auth

router.post('/', predict);
router.get('/history', getHistory);
router.get('/:id', getPrediction);

module.exports = router;
