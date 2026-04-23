require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to database then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Stitch Health API running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}/api/ping`);
  });
});
