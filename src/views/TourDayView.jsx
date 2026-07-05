import { money } from '../lib/format';

function fmtTourDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function groupByTourDate(houses) {
  const sorted = [...houses].sort((a, b) => {
    const da = a.tourDate || '';
    const db = b.tourDate || '';
    if (da !== db) return db.localeCompare(da); // newest first
    if (!a.openStart && !b.openStart) return 0;
    if (!a.openStart) return 1;
    if (!b.openStart) return -1;
    return a.openStart.localeCompare(b.openStart);
  });
  const map = new Map();
  for (const h of sorted) {
    const key = h.tourDate || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(h);
  }
  return [...map.entries()];
}

function sortByTime(houses) {
  return [...houses].sort((a, b) => {
    if (!a.openStart && !b.openStart) return 0;
    if (!a.openStart) return 1;
    if (!b.openStart) return -1;
    return a.openStart.localeCompare(b.openStart);
  });
}

function copyAddresses(houses) {
  const text = houses
    .map((h, i) => `${i + 1}. ${h.address}${h.zip ? ', ' + h.zip : ''}${h.openTime ? ' (' + h.openTime + ')' : ''}`)
    .join('\n');
  navigator.clipboard?.writeText(text).catch(() => {});
}

function fmt24to12(openStart) {
  if (!openStart) return '—';
  return openStart.replace(/^(\d+):(\d+)$/, (_, h, m) => {
    const n = Number(h);
    const ampm = n >= 12 ? 'PM' : 'AM';
    return `${n > 12 ? n - 12 : n || 12}:${m} ${ampm}`;
  });
}

export default function TourDayView({ houses, onToggleToured }) {
  const groups = groupByTourDate(houses);

  // "Up next" = first untoured house across all dates, newest date first
  const allSorted = groups.flatMap(([, hs]) => hs);
  const nextUp = allSorted.find((h) => !h.toured);

  return (
    <div className="view">
      <header className="view-header">
        <h1 className="view-title">Tour Day</h1>
        {houses.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => copyAddresses(sortByTime(houses))}>
            Copy addresses
          </button>
        )}
      </header>

      {houses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗓</div>
          <h2>No houses added</h2>
          <p>Add houses in Gallery and they'll appear here sorted by open-house time.</p>
        </div>
      ) : (
        <>
          {nextUp && (
            <div className="next-banner">
              <span>🏁</span>
              <span>
                Up next: <strong>{nextUp.address}</strong>
                {nextUp.openTime && <> at {nextUp.openTime}</>}
              </span>
            </div>
          )}

          {groups.map(([date, groupHouses], gi) => (
            <div key={date || '__undated__'}>
              <div className="tourday-date-header">
                {date ? fmtTourDate(date) : 'No date set'}
              </div>
              <div className="tourday-list">
                {groupHouses.map((house, i) => (
                  <label
                    key={house.id}
                    className={`tour-item${house.toured ? ' toured' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      className="tour-checkbox"
                      type="checkbox"
                      checked={!!house.toured}
                      onChange={() => onToggleToured(house.id)}
                    />
                    <div className="tour-time-col">
                      <span className="tour-time">{fmt24to12(house.openStart)}</span>
                      <span className="tour-order">#{i + 1}</span>
                    </div>
                    <div className="tour-divider" />
                    <div className="tour-info">
                      <div className="tour-address">{house.address}</div>
                      <div className="tour-meta">
                        {money(house.price)}
                        {house.openTime && <> · {house.openTime}</>}
                      </div>
                    </div>
                    {house.photo ? (
                      <img className="tour-thumb" src={house.photo} alt={house.address} />
                    ) : (
                      <div className="tour-thumb-ph">🏠</div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
