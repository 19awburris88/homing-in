import { statBeds, statBaths, statSqft, perSqft } from '../lib/format';

export default function StatRow({ beds, baths, sqft, price }) {
  return (
    <div className="stat-row">
      <div className="stat-cell">
        <span className="stat-value">{statBeds(beds)}</span>
        <span className="stat-label">Beds</span>
      </div>
      <div className="stat-cell">
        <span className="stat-value">{statBaths(baths)}</span>
        <span className="stat-label">Baths</span>
      </div>
      <div className="stat-cell">
        <span className="stat-value">{statSqft(sqft)}</span>
        <span className="stat-label">Sqft</span>
      </div>
      <div className="stat-cell ppsqft">
        <span className="stat-value">{perSqft(price, sqft)}</span>
        <span className="stat-label">$/sf</span>
      </div>
    </div>
  );
}
