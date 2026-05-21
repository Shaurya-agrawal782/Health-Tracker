const rateLimit = require('express-rate-limit');

const skipPreflight = (req) => req.method === 'OPTIONS';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  }
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.'
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.'
  }
});

module.exports = {
  authLimiter,
  otpLimiter,
  passwordResetLimiter
};
