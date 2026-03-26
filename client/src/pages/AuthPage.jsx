import { createElement, useState } from 'react';
import { HiChartBar, HiOfficeBuilding, HiShieldCheck } from 'react-icons/hi';
import ThemeToggle from '../components/ThemeToggle';
import { useApp } from '../context/AppContext';

const featureCards = [
  {
    icon: HiChartBar,
    title: 'Clear Reporting',
    description: 'Review spending, balances, and category performance in one place.',
  },
  {
    icon: HiShieldCheck,
    title: 'Private Workspace',
    description: 'Keep your financial data tied to your account with secure access.',
  },
  {
    icon: HiOfficeBuilding,
    title: 'Shared Balances',
    description: 'Track borrowed and lent money without losing who owes what.',
  },
];

export default function AuthPage() {
  const {
    login,
    signup,
    error,
    notice,
    pendingConfirmationEmail,
    resendConfirmation,
    setError,
    setNotice,
  } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    totalBalance: '',
  });

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleResend = async () => {
    setResending(true);

    try {
      await resendConfirmation(formData.email || pendingConfirmationEmail);
    } catch {
      // Error state is already handled in context.
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(
          formData.name,
          formData.email,
          formData.password,
          parseFloat(formData.totalBalance) || 0
        );
      }
    } catch {
      // Error state is already handled in context.
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setNotice('');
    setFormData({ name: '', email: '', password: '', totalBalance: '' });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-toolbar">
          <ThemeToggle />
        </div>

        <div className="auth-shell">
          <section className="glass-card auth-showcase">
            <div className="auth-brand">
              <div className="auth-logo">SX</div>
              <div>
                <div className="auth-brand-name">SpendX</div>
                <div className="auth-brand-tag">Personal finance workspace</div>
              </div>
            </div>

            <div className="auth-showcase-copy">
              <p className="section-kicker">Track With Clarity</p>
              <h1>Manage spending, balance, and shared payments with a cleaner system.</h1>
              <p className="auth-showcase-text">
                Built for a fast daily workflow: record transactions quickly, review trends,
                and stay on top of shared payments without clutter.
              </p>
            </div>

            <div className="auth-feature-grid">
              {featureCards.map((feature) => (
                <article key={feature.title} className="auth-feature-card">
                  <div className="auth-feature-icon">
                    {createElement(feature.icon)}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>

            <div className="auth-insight-grid">
              <div className="auth-insight-card">
                <span>Quick Entry</span>
                <strong>Fast Capture</strong>
                <p>Add a transaction in seconds from any screen.</p>
              </div>
              <div className="auth-insight-card">
                <span>Cash Flow</span>
                <strong>Live Overview</strong>
                <p>Balance, spending, borrowed, and lent amounts stay visible.</p>
              </div>
              <div className="auth-insight-card">
                <span>Categories</span>
                <strong>Visual Trends</strong>
                <p>Understand where money goes with a cleaner breakdown.</p>
              </div>
            </div>
          </section>

          <section className="glass-card auth-form-panel">
            <div className="auth-form-header">
              <p className="section-kicker">Account Access</p>
              <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p>
                {isLogin
                  ? 'Sign in to continue tracking your finances with a cleaner dashboard.'
                  : 'Set up your account with your opening balance and start tracking immediately.'}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="input-group animate-fade-in">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="input-field"
                    placeholder="Aarav Mehta"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              {!isLogin && (
                <div className="input-group animate-fade-in">
                  <label>Opening Balance</label>
                  <input
                    type="number"
                    name="totalBalance"
                    className="input-field"
                    placeholder="25000"
                    value={formData.totalBalance}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {notice && <div className="auth-notice">{notice}</div>}
              {error && <div className="auth-error">{error}</div>}

              {pendingConfirmationEmail && (
                <div className="auth-helper-actions">
                  <button
                    type="button"
                    className="btn btn-ghost auth-helper-btn"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? 'Sending Confirmation...' : 'Resend Confirmation Email'}
                  </button>
                </div>
              )}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading
                  ? (isLogin ? 'Signing In...' : 'Creating Account...')
                  : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="auth-form-footer">
              <span>{isLogin ? 'Need an account?' : 'Already have an account?'}</span>
              <button type="button" className="auth-switch" onClick={toggleMode}>
                {isLogin ? 'Create One' : 'Sign In Instead'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
