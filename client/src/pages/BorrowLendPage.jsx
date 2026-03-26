import ThemeToggle from '../components/ThemeToggle';
import { useApp } from '../context/AppContext';

const currencySymbol = '\u20B9';

export default function BorrowLendPage() {
  const { transactions } = useApp();

  const borrowed = transactions.filter((transaction) => transaction.type === 'borrowed');
  const lent = transactions.filter((transaction) => transaction.type === 'lent');

  const totalBorrowed = borrowed.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalLent = lent.reduce((sum, transaction) => sum + transaction.amount, 0);

  const groupByPerson = (items) => {
    const grouped = {};

    items.forEach((transaction) => {
      const personName = transaction.person || 'Unknown';

      if (!grouped[personName]) {
        grouped[personName] = { person: personName, total: 0, transactions: [] };
      }

      grouped[personName].total += transaction.amount;
      grouped[personName].transactions.push(transaction);
    });

    return Object.values(grouped).sort((first, second) => second.total - first.total);
  };

  const borrowedPeople = groupByPerson(borrowed);
  const lentPeople = groupByPerson(lent);

  return (
    <div className="animate-fade-in-up">
      <div className="top-bar">
        <div className="top-bar-left">
          <p className="section-kicker">Shared Balances</p>
          <h2>Borrowing and lending</h2>
          <p>Monitor what you owe and what others owe you.</p>
        </div>

        <div className="top-bar-right">
          <ThemeToggle />
        </div>
      </div>

      <div className="bl-summary-grid">
        <div className="glass-card summary-card summary-card-borrowed">
          <div className="summary-card-label">You Borrowed</div>
          <div className="summary-card-value">
            {currencySymbol}{totalBorrowed.toLocaleString('en-IN')}
          </div>
          <div className="summary-card-meta">
            Across {borrowedPeople.length} {borrowedPeople.length === 1 ? 'contact' : 'contacts'}
          </div>
        </div>

        <div className="glass-card summary-card summary-card-lent">
          <div className="summary-card-label">You Lent</div>
          <div className="summary-card-value">
            {currencySymbol}{totalLent.toLocaleString('en-IN')}
          </div>
          <div className="summary-card-meta">
            Across {lentPeople.length} {lentPeople.length === 1 ? 'contact' : 'contacts'}
          </div>
        </div>
      </div>

      {borrowedPeople.length > 0 && (
        <>
          <div className="section-header">
            <div>
              <p className="section-kicker">Outgoing</p>
              <h3>You owe</h3>
            </div>
          </div>

          <div className="bl-list bl-section">
            {borrowedPeople.map((person) => (
              <div key={person.person} className="glass-card bl-item bl-borrowed">
                <div className="bl-info">
                  <div className="bl-avatar">{person.person[0]?.toUpperCase()}</div>
                  <div className="bl-details">
                    <h4>{person.person}</h4>
                    <p>
                      {person.transactions.length} transaction
                      {person.transactions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="bl-amount">
                  {currencySymbol}{person.total.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lentPeople.length > 0 && (
        <>
          <div className="section-header">
            <div>
              <p className="section-kicker">Incoming</p>
              <h3>They owe you</h3>
            </div>
          </div>

          <div className="bl-list">
            {lentPeople.map((person) => (
              <div key={person.person} className="glass-card bl-item bl-lent">
                <div className="bl-info">
                  <div className="bl-avatar">{person.person[0]?.toUpperCase()}</div>
                  <div className="bl-details">
                    <h4>{person.person}</h4>
                    <p>
                      {person.transactions.length} transaction
                      {person.transactions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="bl-amount">
                  {currencySymbol}{person.total.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {borrowedPeople.length === 0 && lentPeople.length === 0 && (
        <div className="empty-state glass-card">
          <div className="empty-badge">Settled</div>
          <h4>No outstanding balances</h4>
          <p>Borrowed and lent transactions will appear here once you add them.</p>
        </div>
      )}
    </div>
  );
}
