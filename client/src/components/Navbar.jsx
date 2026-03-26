import { HiHome, HiLogout, HiPlus, HiSwitchHorizontal, HiViewList } from 'react-icons/hi';
import { useApp } from '../context/AppContext';

export default function Navbar({ currentPage, setCurrentPage, onAddClick }) {
  const { logout } = useApp();

  const handleLogout = () => {
    if (window.confirm('Sign out of your account?')) {
      setCurrentPage('dashboard');
      logout();
    }
  };

  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentPage('dashboard')}
      >
        <HiHome className="nav-icon" />
        <span>Overview</span>
      </button>

      <button
        type="button"
        className={`nav-item ${currentPage === 'transactions' ? 'active' : ''}`}
        onClick={() => setCurrentPage('transactions')}
      >
        <HiViewList className="nav-icon" />
        <span>Activity</span>
      </button>

      <button
        type="button"
        className="nav-add-btn"
        onClick={onAddClick}
        aria-label="Add transaction"
      >
        <HiPlus />
      </button>

      <button
        type="button"
        className={`nav-item ${currentPage === 'borrowlend' ? 'active' : ''}`}
        onClick={() => setCurrentPage('borrowlend')}
      >
        <HiSwitchHorizontal className="nav-icon" />
        <span>Balances</span>
      </button>

      <button type="button" className="nav-item" onClick={handleLogout}>
        <HiLogout className="nav-icon" />
        <span>Sign Out</span>
      </button>
    </nav>
  );
}
