const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const { buildSubscriptionPayload, ensureSubscriptionState } = require('../services/subscription.service');

function buildAuthPayload(user, token, statusMessage) {
  ensureSubscriptionState(user);

  return {
    message: statusMessage,
    userId: user._id,
    token,
    user: {
      id: user._id,
      name: user.name || '',
      email: user.email,
      theme: user.theme,
      timezone: user.timezone || 'UTC',
      dashboardLayout: user.dashboardLayout || 'comfortable',
      defaultAlertEmail: user.defaultAlertEmail || '',
      defaultScanFrequency: user.defaultScanFrequency || 'hourly',
      subscription: buildSubscriptionPayload(user),
      notifications: {
        emailAlerts: user.notifications?.emailAlerts ?? true,
        issueAlerts: user.notifications?.issueAlerts ?? true,
        performanceAlerts: user.notifications?.performanceAlerts ?? true,
        weeklySummary: user.notifications?.weeklySummary ?? false
      }
    },
    theme: user.theme
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name: name?.trim() || '', email, password: hashedPassword });
    ensureSubscriptionState(newUser);
    await newUser.save();

    // Generate token after register
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json(buildAuthPayload(newUser, token, 'User registered successfully'));
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a secure JSON Web Token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(200).json(buildAuthPayload(user, token, 'Login successful'));
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};
