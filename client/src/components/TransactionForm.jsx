import { useState } from 'react';
import { HiX } from 'react-icons/hi';
import { useApp } from '../context/AppContext';

const categories = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other',
];

export default function TransactionForm({ onClose }) {
  const { addTransaction } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Food',
    description: '',
    person: '',
    date: new Date().toISOString().slice(0, 16),
  });

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await addTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      onClose();
    } catch {
      // Error state is already handled in context.
    } finally {
      setLoading(false);
    }
  };

  const showPerson = formData.type === 'borrowed' || formData.type === 'lent';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Add Transaction</h3>
            <p className="modal-copy">
              Capture an expense, money borrowed, or money lent.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close transaction form"
          >
            <HiX />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Transaction Type</label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-btn ${formData.type === 'expense' ? 'active-expense' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === 'borrowed' ? 'active-borrowed' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'borrowed' })}
              >
                Borrowed
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === 'lent' ? 'active-lent' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'lent' })}
              >
                Lent
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Amount</label>
            <input
              type="number"
              name="amount"
              className="input-field"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="input-group">
            <label>Category</label>
            <div className="category-picker">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`category-pill ${formData.category === category ? 'active' : ''}`}
                  aria-pressed={formData.category === category}
                  onClick={() => setFormData({ ...formData, category })}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Description</label>
            <input
              type="text"
              name="description"
              className="input-field"
              placeholder="Dinner, cab fare, rent, or project expense"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {showPerson && (
            <div className="input-group animate-fade-in">
              <label>{formData.type === 'borrowed' ? 'Borrowed From' : 'Lent To'}</label>
              <input
                type="text"
                name="person"
                className="input-field"
                placeholder="Contact name"
                value={formData.person}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label>Date and Time</label>
            <input
              type="datetime-local"
              name="date"
              className="input-field"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
