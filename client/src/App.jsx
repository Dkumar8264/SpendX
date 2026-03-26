import { useState } from 'react';
import Navbar from './components/Navbar';
import TransactionForm from './components/TransactionForm';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import BorrowLendPage from './pages/BorrowLendPage';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import './index.css';

function AppContent() {
  const { user, loading } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);

  if (loading && !user) {
    return (
      <div className="auth-page">
        <div className="loading-container">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app-layout">
      <div className="main-content">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'transactions' && <TransactionsPage />}
        {currentPage === 'borrowlend' && <BorrowLendPage />}
      </div>

      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onAddClick={() => setShowForm(true)}
      />

      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
