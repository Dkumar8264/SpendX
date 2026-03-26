const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all transactions for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const { month, year, type } = req.query;
    let filter = { userId: req.userId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (type) {
      filter.type = type;
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error 💀', error: error.message });
  }
});

// Get summary stats
router.get('/summary', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const transactions = await Transaction.find({ userId: req.userId });

    let totalSpent = 0;
    let totalBorrowed = 0;
    let totalLent = 0;
    const categoryBreakdown = {};

    transactions.forEach(t => {
      if (t.type === 'expense') {
        totalSpent += t.amount;
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      } else if (t.type === 'borrowed') {
        totalBorrowed += t.amount;
      } else if (t.type === 'lent') {
        totalLent += t.amount;
      }
    });

    const currentBalance = user.totalBalance - totalSpent - totalLent + totalBorrowed;

    res.json({
      totalBalance: user.totalBalance,
      currentBalance,
      totalSpent,
      totalBorrowed,
      totalLent,
      categoryBreakdown,
      transactionCount: transactions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error 💀', error: error.message });
  }
});

// Add a transaction
router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, category, description, person, date } = req.body;

    if ((type === 'borrowed' || type === 'lent') && !person) {
      return res.status(400).json({ message: 'Person name required for borrowed/lent transactions 🤝' });
    }

    const transaction = new Transaction({
      userId: req.userId,
      type,
      amount,
      category,
      description: description || '',
      person: person || '',
      date: date || new Date()
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error 💀', error: error.message });
  }
});

// Delete a transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.userId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found 😵' });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted successfully 🗑️' });
  } catch (error) {
    res.status(500).json({ message: 'Server error 💀', error: error.message });
  }
});

module.exports = router;
