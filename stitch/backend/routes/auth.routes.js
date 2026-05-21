const express = require('express');
const router = express.Router();
const { register, login, guestLogin, getProfile, verifyOtp, sendRegisterOtp, forgotPassword, resetPassword, getLeaderboard } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter, otpLimiter, passwordResetLimiter } = require('../middleware/rateLimit.middleware');

router.post('/register', authLimiter, register);
router.post('/send-register-otp', otpLimiter, sendRegisterOtp);
router.post('/guest', authLimiter, guestLogin);
router.post('/login', authLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/leaderboard', getLeaderboard);
router.get('/profile', protect, getProfile);

module.exports = router;
