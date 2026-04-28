const express = require('express');
const router = express.Router();
const { register, login, getProfile, verifyOtp, sendRegisterOtp, forgotPassword, resetPassword, getLeaderboard } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/send-register-otp', sendRegisterOtp);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/leaderboard', getLeaderboard);
router.get('/profile', protect, getProfile);

module.exports = router;
