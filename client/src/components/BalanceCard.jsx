import { useState } from 'react';
import BalanceResetModal from './BalanceResetModal';

const currencySymbol = '\u20B9';

export default function BalanceCard({ summary }) {
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <>
      <div className="glass-card balance-card animate-fade-in-up">
        <div className="balance-head">
          <div>
            <p className="section-kicker">Balance Snapshot</p>
            <div className="balance-label">Current Balance</div>
          </div>
          <div className="balance-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm balance-reset-btn"
              onClick={() => setShowResetModal(true)}
            >
              Reset Balance
            </button>
            <div className="balance-pill">Live Summary</div>
          </div>
        </div>

        <div className="balance-amount">
          {currencySymbol}{summary.currentBalance?.toLocaleString('en-IN')}
        </div>
        <p className="balance-copy">
          Updated from your spending, borrowed funds, and money you have lent out.
        </p>

        <div className="balance-stats">
          <div className="stat-item stat-spent">
            <div className="stat-value">{currencySymbol}{summary.totalSpent?.toLocaleString('en-IN')}</div>
            <div className="stat-label">Expenses</div>
          </div>
          <div className="stat-item stat-borrowed">
            <div className="stat-value">
              {currencySymbol}{summary.totalBorrowed?.toLocaleString('en-IN')}
            </div>
            <div className="stat-label">Borrowed</div>
          </div>
          <div className="stat-item stat-lent">
            <div className="stat-value">{currencySymbol}{summary.totalLent?.toLocaleString('en-IN')}</div>
            <div className="stat-label">Lent</div>
          </div>
        </div>
      </div>

      {showResetModal && (
        <BalanceResetModal
          currentBalance={summary.currentBalance}
          onClose={() => setShowResetModal(false)}
        />
      )}
    </>
  );
}
