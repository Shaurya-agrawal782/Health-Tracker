const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided'
    });
  }

  // Handle Guest & Mock Google Access for Hackathon Demo
  const mockTokens = ['vitaliq_guest_access_token', 'mock_google_token'];
  if (mockTokens.includes(token)) {
    req.user = {
      _id: '69efa1ed47cbbb02c162bb28', // Using a consistent ID
      name: token === 'mock_google_token' ? 'Google Explorer' : 'Guest Explorer',
      email: token === 'mock_google_token' ? 'google-user@example.com' : 'guest@vitaliq.ai',
      role: 'guest',
      age: 28,
      height: 175,
      weight: 72,
      points: 0,
      currentStreak: 0
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token'
    });
  }
};

module.exports = { protect };
