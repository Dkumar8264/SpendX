import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip);

const colors = [
  '#2563eb',
  '#14b8a6',
  '#f97316',
  '#ef4444',
  '#7c3aed',
  '#0f766e',
  '#f59e0b',
  '#0891b2',
];

const currencySymbol = '\u20B9';

export default function SpendingChart({ breakdown }) {
  const { theme } = useTheme();
  const sortedEntries = Object.entries(breakdown).sort(([, first], [, second]) => second - first);
  const labels = sortedEntries.map(([label]) => label);
  const values = sortedEntries.map(([, value]) => Number(value));
  const totalSpent = values.reduce((sum, value) => sum + value, 0);
  const leadCategory = sortedEntries[0];
  const leadShare = leadCategory && totalSpent > 0
    ? Math.round((leadCategory[1] / totalSpent) * 100)
    : 0;
  const rootStyles = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement)
    : null;
  const chartBorder = rootStyles?.getPropertyValue('--chart-border').trim()
    || (theme === 'dark' ? 'rgba(8, 17, 32, 0.92)' : 'rgba(255, 255, 255, 0.96)');
  const tooltipBackground = rootStyles?.getPropertyValue('--tooltip-bg').trim()
    || 'rgba(15, 23, 42, 0.92)';
  const tooltipTitle = rootStyles?.getPropertyValue('--tooltip-title').trim() || '#f8fafc';
  const tooltipBody = rootStyles?.getPropertyValue('--tooltip-body').trim() || '#e2e8f0';

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map((_, index) => colors[index % colors.length]),
      borderColor: chartBorder,
      borderWidth: 3,
      hoverOffset: 6,
      spacing: 4,
      borderRadius: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: tooltipBackground,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        titleFont: { family: 'Manrope', weight: '700' },
        bodyFont: { family: 'Manrope' },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const percentage = totalSpent > 0
              ? Math.round((context.parsed / totalSpent) * 100)
              : 0;

            return `${context.label}: ${currencySymbol}${context.parsed.toLocaleString('en-IN')} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <section className="glass-card chart-container">
      <div className="chart-header">
        <div>
          <p className="section-kicker">Spending Breakdown</p>
          <h3>Expense categories</h3>
          <p className="chart-copy">
            {labels.length} tracked {labels.length === 1 ? 'category' : 'categories'} with
            recorded expense activity.
          </p>
        </div>

        <div className="chart-total">
          <span>Total Expenses</span>
          <strong>{currencySymbol}{totalSpent.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      <div className="chart-body">
        <div className="chart-visual">
          <div className="chart-wrapper">
            <Doughnut data={data} options={options} />
          </div>

          {leadCategory && (
            <div className="chart-highlight">
              <span>Largest Category</span>
              <strong>{leadCategory[0]}</strong>
              <p>{leadShare}% of recorded expenses</p>
            </div>
          )}
        </div>

        <div className="category-breakdown-list">
          {sortedEntries.slice(0, 6).map(([label, amount], index) => {
            const share = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;

            return (
              <div className="category-row" key={label}>
                <div className="category-meta">
                  <span className="category-rank">#{index + 1}</span>
                  <span
                    className="category-dot"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />

                  <div>
                    <div className="category-name">{label}</div>
                    <div className="category-share">{share}% of total expenses</div>
                  </div>
                </div>

                <div className="category-amount">
                  {currencySymbol}{Number(amount).toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
