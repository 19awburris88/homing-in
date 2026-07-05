import { fmtMoney, walkLabel } from '../lib/area';

// Renders the area-lookup blob stored on a house. Compact, degrades gracefully
// when a source is unavailable (missing Census key, no crime provider, etc.).
export default function AreaPanel({ area }) {
  if (!area) return null;
  if (!area.ok) {
    return <div className="area-note area-note--warn">Couldn't look up this area ({area.reason || 'unknown'}).</div>;
  }

  const demo = area.demographics || {};
  const walk = area.walkability || {};
  const commute = area.commute || {};
  const crime = area.crime || {};

  return (
    <div className="area-panel">
      {commute.available && (
        <div className="area-commute">
          <span className="area-commute-icon">🏥</span>
          <div className="area-commute-body">
            <span className="area-commute-time">{commute.durationMin} min · {commute.distanceMi} mi</span>
            <span className="area-commute-dest">Drive to {commute.destName}</span>
          </div>
        </div>
      )}

      <div className="area-grid">
        {demo.available ? (
          <>
            <Stat label="Median income" value={fmtMoney(demo.medianIncome)} />
            <Stat label="Median home value" value={fmtMoney(demo.medianHomeValue)} />
            <Stat label="Bachelor's+" value={demo.bachelorsPlusPct != null ? demo.bachelorsPlusPct + '%' : '—'} />
            <Stat label="Median age" value={demo.medianAge ?? '—'} />
          </>
        ) : (
          <div className="area-note">Income & demographics need a free Census API key (not configured yet).</div>
        )}
      </div>

      {walk.available && (
        <div className="area-grid">
          <Stat label="Walkability" value={walk.score != null ? `${walk.score}/100` : '—'} sub={walkLabel(walk.score)} />
          <Stat label="Grocery <1mi" value={walk.counts?.grocery ?? '—'} />
          <Stat label="Dining <1mi" value={walk.counts?.dining ?? '—'} />
          <Stat label="Parks <1mi" value={walk.counts?.parks ?? '—'} />
        </div>
      )}

      {area.schools?.length > 0 && (
        <div className="area-schools">
          <span className="area-subhead">Nearby schools</span>
          {area.schools.slice(0, 4).map((s, i) => (
            <div key={i} className="area-school-row">
              <span>{s.name}</span>
              <span className="area-school-dist">{s.distMi != null ? `${s.distMi} mi` : ''}</span>
            </div>
          ))}
        </div>
      )}

      <div className="area-note area-note--muted">
        {crime.available ? null : 'Safety data: add a crime-provider key to enable.'}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="area-stat">
      <span className="area-stat-value">{value}</span>
      <span className="area-stat-label">{label}</span>
      {sub && <span className="area-stat-sub">{sub}</span>}
    </div>
  );
}
