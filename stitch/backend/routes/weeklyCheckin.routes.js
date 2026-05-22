const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createCheckin,
  getCheckins
} = require('../controllers/weeklyCheckin.controller');

router.use(protect); // All check-in endpoints require auth

router.post('/', createCheckin);
router.get('/', getCheckins);

module.exports = router;
