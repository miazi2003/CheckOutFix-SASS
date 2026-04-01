require('dotenv').config();

const app = require('../app');
const connectDB = require('../src/config/db');

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
            console.log("DB connected");
        } catch (err) {
            console.error("DB error:", err.message);
            return res.status(500).json({ error: "DB connection failed" });
        }
    }

    return app(req, res);
};