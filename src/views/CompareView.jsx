import { useState } from 'react';
import { CATEGORIES, total, findWinners } from '../state/score';
import { money, perSqft, statBeds, statBaths, statSqft } from '../lib/format';

export default function CompareView({ houses, settings }) {
  const [selected, setSelected] = useState([]);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const comparing = houses.filter((h) => selected.includes(h.id));
  const winners   = findWinners(comparing);

  const categories = CATEGORIES.map((c) =>
    c.key === 'vibe' ? { ...c, label: settings.vibeLabel } : c
  );

  return (
    <div className="view">
      <header className="view-header">
        <h1 className="view-title">Compare</h1>
      </header>

      {/* House picker */}
      <div className="compare-picker">
        <div className="compare-picker-title">Select houses to compare</div>
        <div className="picker-chips">
          {houses.map((h) => (
            <button
              key={h.id}
              className={`picker-chip${selected.includes(h.id) ? ' selected' : ''}`}
              onClick={() => toggle(h.id)}
            >
              {selected.includes(h.id) && <span className="picker-chip-check">✓</span>}
              {h.address.split(' ').slice(0, 3).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      {comparing.length < 2 ? (
        <div className="compare-empty">
          {houses.length < 2
            ? 'Add at least two houses in Gallery to compare.'
            : 'Select two or more houses above to see a side-by-side comparison.'}
        </div>
      ) : (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <colgroup>
              <col style={{ width: '100px' }} />
              {comparing.map((h) => (
                <col key={h.id} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="row-label" />
                {comparing.map((h) => {
                  const isWinner = winners.includes(h.id);
                  return (
                    <th key={h.id} className={isWinner ? 'col-winner' : ''}>
                      {h.address.split(',')[0]}
                      {isWinner && (
                        <span className="winner-ribbon">
                          {winners.length > 1 ? '🤝 Tie' : '🏆 Winner'}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Photos */}
              <tr>
                <td className="row-label">Photo</td>
                {comparing.map((h) => (
                  <td key={h.id} className={winners.includes(h.id) ? 'col-winner' : ''}>
                    {h.photo
                      ? <img className="compare-thumb" src={h.photo} alt={h.address} />
                      : <div className="compare-thumb-ph">🏠</div>}
                  </td>
                ))}
              </tr>

              {/* Basic stats */}
              {[
                { label: 'Price',  fn: (h) => money(h.price)                          },
                { label: '$/sqft', fn: (h) => perSqft(h.price, h.sqft)                },
                { label: 'Beds',   fn: (h) => statBeds(h.beds)                         },
                { label: 'Baths',  fn: (h) => statBaths(h.baths)                       },
                { label: 'Sqft',   fn: (h) => statSqft(h.sqft)                         },
                { label: 'Style',  fn: (h) => h.style || '—'                           },
              ].map(({ label, fn }) => (
                <tr key={label}>
                  <td className="row-label">{label}</td>
                  {comparing.map((h) => (
                    <td key={h.id} className={winners.includes(h.id) ? 'col-winner' : ''}>
                      {fn(h)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Score categories */}
              {categories.map((cat) => (
                <tr key={cat.key}>
                  <td className="row-label">{cat.label}</td>
                  {comparing.map((h) => {
                    const v = h.scores?.[cat.key] || 0;
                    return (
                      <td key={h.id} className={winners.includes(h.id) ? 'col-winner' : ''}>
                        <span className="score-num">{v || '—'}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Total */}
              <tr>
                <td className="row-label" style={{ fontWeight: 700, color: 'var(--ink)' }}>Total</td>
                {comparing.map((h) => (
                  <td
                    key={h.id}
                    className={winners.includes(h.id) ? 'col-winner' : ''}
                  >
                    <span className="total-num">{total(h.scores)}/25</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
