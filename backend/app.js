const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const billingRoutes = require('./src/routes/billing.routes');
const storeRoutes = require('./src/routes/store.routes');
const scanRoutes = require('./src/routes/scan.routes');
const userRoutes = require('./src/routes/user.routes');
const billingController = require('./src/controllers/billing.controller');

dotenv.config();

const app = express();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function normalizeOrigin(value) {
  return value ? value.trim().replace(/\/+$/, '') : value;
}

const allowedOrigins = (
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(normalizeOrigin).filter(Boolean)
    : defaultAllowedOrigins.map(normalizeOrigin)
);

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(
  cors(corsOptions)
);
app.options(/.*/, cors(corsOptions));

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    await connectDB();
    return billingController.handleWebhook(req, res);
  } catch (error) {
    return res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await connectDB();
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Database connection failed' });
  }
});

app.use('/api/auth', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
}, authRoutes);

app.use('/api/billing', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
}, billingRoutes);

app.use('/api/stores', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
}, storeRoutes);

app.use('/api/scan', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
}, scanRoutes);

app.use('/api/users', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
}, userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error.message && error.message.startsWith('CORS blocked')) {
    return res.status(403).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
