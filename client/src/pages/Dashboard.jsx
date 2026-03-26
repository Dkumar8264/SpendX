import BalanceCard from '../components/BalanceCard';
import SpendingChart from '../components/SpendingChart';
import ThemeToggle from '../components/ThemeToggle';
import TransactionList from '../components/TransactionList';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { user, transactions, summary, loading } = useApp();

  if (loading || !summary) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="animate-fade-in-up">
      <div className="top-bar">
        <div className="top-bar-left">
          <p className="section-kicker">Overview</p>
          <h2>Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p>Review your balance, recent activity, and category performance.</p>
        </div>

        <div className="top-bar-right">
          <ThemeToggle />
        </div>
      </div>

      <BalanceCard summary={summary} />

      {summary.categoryBreakdown && Object.keys(summary.categoryBreakdown).length > 0 && (
        <SpendingChart breakdown={summary.categoryBreakdown} />
      )}

      <div className="section-header">
        <div>
          <p className="section-kicker">Latest Entries</p>
          <h3>Recent transactions</h3>
        </div>
      </div>

      {recentTransactions.length > 0 ? (
        <TransactionList transactions={recentTransactions} />
      ) : (
        <div className="empty-state glass-card">
          <div className="empty-badge">No Data</div>
          <h4>No transactions yet</h4>
          <p>Use the add button to record your first transaction.</p>
        </div>
      )}
    </div>
  );
}
