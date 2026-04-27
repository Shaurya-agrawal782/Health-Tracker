const express = require('express');
const router = express.Router();
const { register, login, getProfile, verifyOtp, sendRegisterOtp } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/send-register-otp', sendRegisterOtp);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.get('/profile', protect, getProfile);

module.exports = router;
