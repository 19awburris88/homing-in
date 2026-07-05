import HouseCard from '../components/HouseCard';
import logo from '../assets/logo.png';

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

function formatDateHeading(dateStr) {
  if (!dateStr) return null;
  // Parse as local date to avoid timezone shift
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function groupByTourDate(houses) {
  const map = new Map();
  for (const h of houses) {
    const key = h.tourDate || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(h);
  }

  // Sort groups: dated groups descending by date, undated last
  const entries = [...map.entries()].sort(([a], [b]) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return b.localeCompare(a); // descending — newest tour first
  });

  return entries.map(([date, hs]) => ({ date, houses: hs }));
}

function getTourRanks(houses) {
  const sorted = [...houses].sort((a, b) => {
    if (!a.openStart && !b.openStart) return 0;
    if (!a.openStart) return 1;
    if (!b.openStart) return -1;
    return a.openStart.localeCompare(b.openStart);
  });
  const map = {};
  sorted.forEach((h, i) => { map[h.id] = i + 1; });
  return map;
}

export default function GalleryView({
  houses,
  settings,
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateScore,
  onUpdateNotes,
  onOpenArea,
  onSettings,
}) {
  const rankMap = getTourRanks(houses);
  const groups  = groupByTourDate(houses);

  return (
    <div className="view">
      <header className="view-header">
        <div className="brand">
          <img className="brand-logo" src={logo} alt="Homing In" />
          <span className="brand-text">
            <span className="brand-title">Homing In</span>
            <span className="brand-sub">Austin &amp; Adrienne</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="icon-btn" onClick={onSettings} aria-label="Settings">
            <GearIcon />
          </button>
          <button className="btn btn-primary" onClick={onAdd}>+ Add House</button>
        </div>
      </header>

      {houses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏡</div>
          <h2>No houses yet</h2>
          <p>Add your first house to start comparing and rating during the tour.</p>
          <button className="btn btn-primary" onClick={onAdd}>Add your first house</button>
        </div>
      ) : (
        <div className="gallery-content">
          {groups.map(({ date, houses: groupHouses }) => (
            <section key={date || '__undated__'} className="date-group">
              {date ? (
                <div className="date-group-header">
                  <span className="date-group-label">{formatDateHeading(date)}</span>
                  <span className="date-group-count">{groupHouses.length} {groupHouses.length === 1 ? 'house' : 'houses'}</span>
                </div>
              ) : (
                <div className="date-group-header date-group-header--undated">
                  <span className="date-group-label">No date set</span>
                  <span className="date-group-count">{groupHouses.length} {groupHouses.length === 1 ? 'house' : 'houses'}</span>
                </div>
              )}
              <div className="gallery-grid">
                {groupHouses.map((house) => (
                  <HouseCard
                    key={house.id}
                    house={house}
                    rank={rankMap[house.id]}
                    vibeLabel={settings.vibeLabel}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onUpdateScore={onUpdateScore}
                    onUpdateNotes={onUpdateNotes}
                    onOpenArea={onOpenArea}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
