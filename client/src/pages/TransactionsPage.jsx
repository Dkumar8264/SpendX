import { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import TransactionList from '../components/TransactionList';
import { useApp } from '../context/AppContext';

const tabLabels = {
  all: 'All',
  expense: 'Expenses',
  borrowed: 'Borrowed',
  lent: 'Lent',
};

export default function TransactionsPage() {
  const { transactions } = useApp();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((transaction) => transaction.type === filter);

  return (
    <div className="animate-fade-in-up">
      <div className="top-bar">
        <div className="top-bar-left">
          <p className="section-kicker">Activity</p>
          <h2>Transactions</h2>
          <p>{transactions.length} total entries across all recorded activity.</p>
        </div>

        <div className="top-bar-right">
          <ThemeToggle />
        </div>
      </div>

      <div className="tabs">
        {['all', 'expense', 'borrowed', 'lent'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-btn ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <TransactionList transactions={filtered} />
      ) : (
        <div className="empty-state glass-card">
          <div className="empty-badge">Filtered</div>
          <h4>No transactions found</h4>
          <p>
            {filter === 'all'
              ? 'Add a transaction to start building your history.'
              : `There are no ${tabLabels[filter].toLowerCase()} entries in this view.`}
          </p>
        </div>
      )}
    </div>
  );
}
