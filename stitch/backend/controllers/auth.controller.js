const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult, body } = require('express-validator');
const User = require('../models/User');

const OTP_SALT_ROUNDS = 10;
const REGISTER_OTP_TTL_MS = 10 * 60 * 1000;
const FORGOT_PASSWORD_RESPONSE = {
  success: true,
  message: 'If this email exists, an OTP has been sent.'
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const buildGuestUser = (id) => ({
  id,
  name: 'Guest User',
  email: 'guest@vitaliq.local',
  role: 'guest',
  isGuest: true
});

const PendingOtp = require('../models/PendingOtp');
const { sendOtpEmail } = require('../services/emailService');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = async (otp) => bcrypt.hash(String(otp), OTP_SALT_ROUNDS);

const compareOtp = async (otp, hashedOtp) => {
  if (!otp || !hashedOtp) return false;

  try {
    return await bcrypt.compare(String(otp), hashedOtp);
  } catch (error) {
    return false;
  }
};

const invalidOtpResponse = (res) => {
  return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
};

// @desc    Start temporary guest session
// @route   POST /api/auth/guest
exports.guestLogin = async (req, res) => {
  try {
    const id = `guest-${Date.now()}`;
    const token = jwt.sign(
      {
        id,
        role: 'guest',
        isGuest: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      message: 'Guest session started',
      token,
      user: buildGuestUser(id)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Guest login is temporarily unavailable' });
  }
};

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
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);
    
    // Save to PendingOtp (updates if exists)
    await PendingOtp.findOneAndUpdate(
      { email },
      { otp: hashedOtp, createdAt: new Date() },
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

      const pending = await PendingOtp.findOne({
        email,
        createdAt: { $gt: new Date(Date.now() - REGISTER_OTP_TTL_MS) }
      });
      const isOtpValid = await compareOtp(otp, pending?.otp);

      if (!isOtpValid) {
        return invalidOtpResponse(res);
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
          longestStreak: user.longestStreak,
          preferences: user.preferences
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
      const otp = generateOtp();
      user.otp = await hashOtp(otp);
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

    const user = await User.findOne({ email, otpExpire: { $gt: Date.now() } });
    const isOtpValid = await compareOtp(otp, user?.otp);
    
    if (!user || !isOtpValid) {
      return invalidOtpResponse(res);
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'OTP verified successfully',
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
        longestStreak: user.longestStreak,
        preferences: user.preferences
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

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Forgot password requested for non-existent email.');
      }
      return res.json(FORGOT_PASSWORD_RESPONSE);
    }

    // Generate 6-digit OTP
    const otp = generateOtp();
    user.otp = await hashOtp(otp);
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send Email
    await sendOtpEmail(email, otp);

    res.json(FORGOT_PASSWORD_RESPONSE);
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

      const user = await User.findOne({ email, otpExpire: { $gt: Date.now() } });
      const isOtpValid = await compareOtp(otp, user?.otp);
      
      if (!user || !isOtpValid) {
        return invalidOtpResponse(res);
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

function anonymizeName(name = "VitalIQ User") {
  const trimmed = String(name).trim();
  if (trimmed === 'Guest User') return 'Guest';
  const parts = trimmed.split(" ");
  if (parts.length === 1) return parts[0];
  if (parts[1] && parts[1][0]) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return parts[0];
}

// @desc    Get leaderboard (Top users by points)
// @route   GET /api/auth/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ points: -1 })
      .limit(10)
      .select('name points currentStreak');

    const leaderboard = users.map((u, index) => ({
      position: index + 1,
      displayName: anonymizeName(u.name),
      wellnessPoints: u.points,
      streak: u.currentStreak,
      badge: u.points >= 4000 ? 'Elite' : u.points >= 3000 ? 'Expert' : u.points >= 1000 ? 'Pro' : 'Beginner',
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
    if (req.user?.isGuest) {
      return res.json({
        success: true,
        user: buildGuestUser(req.user.id)
      });
    }

    if (req.user?.isMockGoogle) {
      return res.json({
        success: true,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          isMockGoogle: true,
          age: req.user.age,
          gender: req.user.role === 'guest' ? 'other' : req.user.gender,
          height: req.user.height,
          weight: req.user.weight,
          points: req.user.points,
          currentStreak: req.user.currentStreak,
          longestStreak: req.user.longestStreak
        }
      });
    }

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
        createdAt: user.createdAt,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user preferences (Onboarding)
// @route   PUT /api/auth/preferences
exports.updatePreferences = async (req, res) => {
  try {
    if (req.user?.isGuest || req.user?.isMockGoogle) {
      return res.status(400).json({ success: false, message: 'Guests should save preferences locally' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.preferences = {
      ...user.preferences,
      ...req.body
    };

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
