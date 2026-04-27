const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  addHealthData,
  getHistory,
  getLatest,
  getRisk,
  getSummary,
  chatWithCoach
} = require('../controllers/health.controller');

router.use(protect); // All routes require auth

router.post('/add', addHealthData);
router.get('/history', getHistory);
router.get('/latest', getLatest);
router.get('/risk', getRisk);
router.get('/summary', getSummary);
router.post('/chat', chatWithCoach);

module.exports = router;
