import {
  HiArrowCircleDown,
  HiArrowCircleUp,
  HiCollection,
  HiOutlineTrash,
  HiTrendingDown,
} from 'react-icons/hi';
import { useApp } from '../context/AppContext';

const typeMeta = {
  expense: { icon: HiTrendingDown, label: 'Expense' },
  borrowed: { icon: HiArrowCircleDown, label: 'Borrowed' },
  lent: { icon: HiArrowCircleUp, label: 'Lent' },
};

const currencySymbol = '\u20B9';

export default function TransactionList({ transactions }) {
  const { deleteTransaction } = useApp();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);

    return (
      date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' at ' +
      date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  return (
    <div className="transaction-list">
      {transactions.map((transaction, index) => {
        const { icon: Icon = HiCollection, label = 'Entry' } = typeMeta[transaction.type] || {};

        return (
          <div
            key={transaction._id}
            className={`glass-card transaction-item type-${transaction.type}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="transaction-icon">
              <Icon />
            </div>

            <div className="transaction-details">
              <h4>{transaction.description || transaction.category}</h4>
              <p>
                {transaction.category} | {label}
                {transaction.person ? ` | ${transaction.person}` : ''}
              </p>
            </div>

            <div className="transaction-right">
              <div className="transaction-amount">
                {transaction.type === 'expense' || transaction.type === 'lent' ? '-' : '+'}
                {currencySymbol}{transaction.amount.toLocaleString('en-IN')}
              </div>
              <div className="transaction-date">{formatDate(transaction.date)}</div>
            </div>

            <button
              type="button"
              className="transaction-delete"
              onClick={() => deleteTransaction(transaction._id)}
              title="Delete transaction"
              aria-label="Delete transaction"
            >
              <HiOutlineTrash />
            </button>
          </div>
        );
      })}
    </div>
  );
}
