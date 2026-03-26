import { HiMoon, HiSun } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const nextThemeLabel = isDarkTheme ? 'Light Mode' : 'Dark Mode';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextThemeLabel}`}
      title={`Switch to ${nextThemeLabel}`}
    >
      <span className="theme-toggle-icon">
        {isDarkTheme ? <HiSun /> : <HiMoon />}
      </span>
      <span className="theme-toggle-copy">{nextThemeLabel}</span>
    </button>
  );
}
