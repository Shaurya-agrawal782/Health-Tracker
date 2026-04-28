const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const PendingOtp = require('../models/PendingOtp');
const { sendOtpEmail } = require('../services/emailService');

// @desc    Send Registration OTP
// @route   POST /api/auth/send-register-otp
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to PendingOtp (updates if exists)
    await PendingOtp.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send Email
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register user (Final Step)
// @route   POST /api/auth/register
exports.register = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
  async (req, res) => {
    try {
      const { name, email, password, age, gender, height, weight, otp } = req.body;

      // Verify OTP
      const pending = await PendingOtp.findOne({ email, otp });
      if (!pending) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      // Delete OTP
      await PendingOtp.deleteOne({ _id: pending._id });

      const user = await User.create({ name, email, password, age, gender, height, weight });
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          gender: user.gender,
          height: user.height,
          weight: user.weight,
          points: user.points,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
];


// @desc    Login user (Step 1: Check credentials & Send OTP)
// @route   POST /api/auth/login
exports.login = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();

      // Send Email
      await sendOtpEmail(email, otp);

      res.json({
        success: true,
        message: 'OTP sent to email',
        email: user.email
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
];

// @desc    Verify OTP (Step 2: Check OTP & Issue Token)
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        points: user.points,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password (Step 1: Send OTP)
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send Email
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password (Step 2: Verify OTP & Change Password)
// @route   POST /api/auth/reset-password
exports.resetPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
      
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      // Update password
      user.password = newPassword;
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();

      res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
];

// @desc    Get leaderboard (Top users by points)
// @route   GET /api/auth/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ points: -1 })
      .limit(10)
      .select('name points currentStreak');

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      name: u.name,
      points: u.points,
      streak: u.currentStreak,
      level: u.points >= 4000 ? 'Elite' : u.points >= 3000 ? 'Expert' : u.points >= 1000 ? 'Pro' : 'Beginner',
      isUser: req.user && u._id.toString() === req.user._id.toString()
    }));

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        points: user.points,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
