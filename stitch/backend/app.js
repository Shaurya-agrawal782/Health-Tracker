const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const predictRoutes = require('./routes/predict.routes');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

// Middleware 
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests and configured frontend origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/predict', predictRoutes);

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Stitch Health API is running 🏥' });
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
