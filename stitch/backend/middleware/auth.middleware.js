const jwt = require('jsonwebtoken');
const User = require('../models/User');

const GUEST_OBJECT_ID = '69efa1ed47cbbb02c162bb28';
const MOCK_GOOGLE_TOKEN = 'mock_google_token';

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

  // Local development only. Never enable mock Google tokens in production;
  // real Google sign-in must verify Google-issued ID tokens on the backend.
  if (token === MOCK_GOOGLE_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    req.user = {
      _id: GUEST_OBJECT_ID,
      id: 'google-demo-user',
      name: 'Google Demo User',
      email: 'google-demo@vitaliq.local',
      role: 'demo',
      isMockGoogle: true,
      age: 28,
      gender: 'other',
      height: 175,
      weight: 72,
      points: 0,
      currentStreak: 0,
      longestStreak: 0
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.isGuest || decoded.role === 'guest') {
      if (!decoded.id) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized â€” invalid token'
        });
      }

      req.user = {
        _id: GUEST_OBJECT_ID,
        id: decoded.id,
        name: 'Guest User',
        email: 'guest@vitaliq.local',
        role: 'guest',
        isGuest: true,
        age: 28,
        gender: 'other',
        height: 175,
        weight: 72,
        points: 0,
        currentStreak: 0,
        longestStreak: 0
      };
      return next();
    }

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
