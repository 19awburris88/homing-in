import { CATEGORIES, total } from '../state/score';
import { money } from '../lib/format';

function fmtTourDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
import StatRow from './StatRow';
import RatingDots from './RatingDots';
import NotesBox from './NotesBox';

export default function HouseCard({
  house,
  rank,
  vibeLabel,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateScore,
  onUpdateNotes,
  onOpenArea,
}) {
  const { id, address, zip, price, beds, baths, sqft, style, tagline, photo, openTime, scores, tourDate, areaData } = house;
  const scoreTotal = total(scores);
  const hasArea = areaData && areaData.ok;

  const categories = CATEGORIES.map((c) =>
    c.key === 'vibe' ? { ...c, label: vibeLabel } : c
  );

  const handleDelete = () => {
    if (window.confirm(`Delete "${address}"?`)) onDelete(id);
  };

  return (
    <article className="house-card">
      {/* Photo — click to view area info */}
      <button
        className="card-photo-wrap card-photo-btn"
        type="button"
        onClick={() => onOpenArea?.(house)}
        aria-label={`Area info for ${address}`}
      >
        {photo ? (
          <img className="card-photo" src={photo} alt={address} />
        ) : (
          <div className="card-photo-placeholder">🏠</div>
        )}
        <div className="card-badges">
          <span className="badge badge-price">{money(price)}</span>
          {openTime && <span className="badge badge-time">{openTime}</span>}
        </div>
        {rank && <span className="badge-rank">{rank}</span>}
        <span className="badge-area">📍 {hasArea ? 'Area info' : 'Look up area'}</span>
      </button>

      {/* Info */}
      <div className="card-body">
        {tagline && <div className="card-tagline">{tagline}</div>}
        <div className="card-address">{address}</div>
        {zip && <div className="card-zip">{zip}</div>}
        {style && <span className="card-style">{style}</span>}
      </div>

      {/* Stats */}
      <StatRow beds={beds} baths={baths} sqft={sqft} price={price} />

      {/* Ratings */}
      <div className="card-body">
        <div className="card-ratings">
          <div className="ratings-header">
            <span className="ratings-title">Ratings</span>
            <span className="ratings-total">{scoreTotal}/25</span>
          </div>
          {categories.map((cat) => (
            <RatingDots
              key={cat.key}
              label={cat.label}
              value={scores?.[cat.key] || 0}
              onChange={(v) => onUpdateScore(id, cat.key, v)}
            />
          ))}
        </div>

        {/* Notes */}
        <NotesBox
          houseId={id}
          value={house.notes}
          onSave={(notes) => onUpdateNotes(id, notes)}
        />
      </div>

      {/* Actions */}
      <div className="card-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(house)}>Edit</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onDuplicate(id)}>Duplicate</button>
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
      </div>
    </article>
  );
}
