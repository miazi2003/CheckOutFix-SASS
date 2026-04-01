require('dotenv').config();

const app = require('./app');
const connectDB = require('./src/config/db');

// Connect DB once (important for serverless)
let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log("DB connected");
    } catch (err) {
      console.error("DB connection failed:", err.message);
      return res.status(500).json({ error: "DB connection failed" });
    }
  }

  return app(req, res); // 🔥 THIS is the key
};

module.exports = handler;