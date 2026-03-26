import { useState } from 'react';
import { HiX } from 'react-icons/hi';
import { useApp } from '../context/AppContext';

const currencySymbol = '\u20B9';

const formatBalanceInput = (value) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

export default function BalanceResetModal({ currentBalance, onClose }) {
  const { error, resetBalance, setError } = useApp();
  const [loading, setLoading] = useState(false);
  const [balanceValue, setBalanceValue] = useState(formatBalanceInput(currentBalance));

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (balanceValue.trim() === '' || Number.isNaN(Number(balanceValue))) {
      setError('Enter a valid balance amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetBalance(Number(balanceValue));
      handleClose();
    } catch {
      // Error state is already handled in context.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="glass-card modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Reset Balance</h3>
            <p className="modal-copy">
              Set the balance you want to see now. Your existing transactions remain unchanged.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            aria-label="Close reset balance dialog"
          >
            <HiX />
          </button>
        </div>

        <form className="balance-reset-form" onSubmit={handleSubmit}>
          <div className="reset-balance-panel">
            <p className="section-kicker">Current Visible Balance</p>
            <div className="reset-balance-value">
              {currencySymbol}{Number(currentBalance || 0).toLocaleString('en-IN')}
            </div>
            <p className="reset-balance-note">
              SpendX will update your balance baseline so this new value becomes your current
              balance without removing any recorded history.
            </p>
          </div>

          <div className="input-group">
            <label>New Current Balance</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              value={balanceValue}
              onChange={(event) => setBalanceValue(event.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating Balance...' : 'Update Balance'}
          </button>
        </form>
      </div>
    </div>
  );
}
