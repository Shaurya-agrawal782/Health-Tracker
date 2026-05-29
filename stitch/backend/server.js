require('dotenv').config();

// Validate critical environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`💥 CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
}

const optionalEnvVars = ['EMAIL_USER', 'EMAIL_PASS', 'FRONTEND_URL'];
const missingOptional = optionalEnvVars.filter(v => !process.env[v]);
if (missingOptional.length > 0) {
  console.warn(`⚠️ Warning: Missing environment variables: ${missingOptional.join(', ')}`);
}

const app = require('./app');
const connectDB = require('./config/db');
const { verifySmtpConnection } = require('./services/emailService');

const PORT = process.env.PORT || 5000;

// Connect to database then start server
connectDB().then(() => {
  app.listen(PORT, async () => {
    console.log(`🚀 VitalIQ Health API running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}/api/ping`);

    // Verify SMTP connection in background (non-blocking)
    verifySmtpConnection().catch(() => {
      console.warn('⚠️ SMTP verification failed — email sending may not work.');
    });
  });
});
