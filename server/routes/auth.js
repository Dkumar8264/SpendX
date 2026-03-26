const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  totalBalance: user.totalBalance,
});

const buildSummaryFromTransactions = (transactions, totalBalance) => {
  let totalSpent = 0;
  let totalBorrowed = 0;
  let totalLent = 0;
  const categoryBreakdown = {};

  transactions.forEach((transaction) => {
    if (transaction.type === 'expense') {
      totalSpent += transaction.amount;
      categoryBreakdown[transaction.category] =
        (categoryBreakdown[transaction.category] || 0) + transaction.amount;
    } else if (transaction.type === 'borrowed') {
      totalBorrowed += transaction.amount;
    } else if (transaction.type === 'lent') {
      totalLent += transaction.amount;
    }
  });

  return {
    totalBalance,
    currentBalance: totalBalance - totalSpent - totalLent + totalBorrowed,
    totalSpent,
    totalBorrowed,
    totalLent,
    categoryBreakdown,
    transactionCount: transactions.length,
  };
};

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, totalBalance } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      totalBalance: totalBalance || 0,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.patch('/balance', auth, async (req, res) => {
  try {
    const requestedCurrentBalance = Number(req.body.currentBalance);

    if (!Number.isFinite(requestedCurrentBalance)) {
      return res.status(400).json({ message: 'Please provide a valid balance amount.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const transactions = await Transaction.find({ userId: req.userId });
    const currentSummary = buildSummaryFromTransactions(transactions, user.totalBalance);

    user.totalBalance =
      requestedCurrentBalance
      + currentSummary.totalSpent
      + currentSummary.totalLent
      - currentSummary.totalBorrowed;

    await user.save();

    res.json({
      message: 'Balance reset successfully.',
      user: buildUserPayload(user),
      summary: buildSummaryFromTransactions(transactions, user.totalBalance),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
