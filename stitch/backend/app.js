const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const predictRoutes = require('./routes/predict.routes');
const weeklyCheckinRoutes = require('./routes/weeklyCheckin.routes');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Add process.env.FRONTEND_URL if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Middleware 
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public Health Check Route
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: "ok",
    service: "VitalIQ Health API",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState
  });
});

// SMTP diagnostic endpoint (no email sent — just tests connection)
app.get('/api/health/smtp', async (req, res) => {
  const { verifySmtpConnection } = require('./services/emailService');
  const hasUser = !!process.env.EMAIL_USER;
  const hasPass = !!process.env.EMAIL_PASS;

  if (!hasUser || !hasPass) {
    return res.json({
      status: 'not_configured',
      EMAIL_USER: hasUser ? 'set' : 'MISSING',
      EMAIL_PASS: hasPass ? 'set' : 'MISSING',
    });
  }

  const smtpOk = await verifySmtpConnection();
  res.json({
    status: smtpOk ? 'ok' : 'failed',
    EMAIL_USER: hasUser ? 'set' : 'MISSING',
    EMAIL_PASS: hasPass ? 'set' : 'MISSING',
    smtp_connection: smtpOk ? 'verified' : 'failed',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/checkins/weekly', weeklyCheckinRoutes);

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'VitalIQ Health API is running 🏥' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
