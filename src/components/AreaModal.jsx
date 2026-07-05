import { useState } from 'react';
import { lookupArea } from '../lib/area';
import AreaPanel from './AreaPanel';

// Opened by clicking a house. Shows the stored area blob and lets you (re)fetch it.
export default function AreaModal({ house, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const area = house.areaData;

  const handleRefresh = async () => {
    const address = [house.address, house.zip].filter(Boolean).join(', ').trim();
    if (!address) return;
    setLoading(true);
    try {
      const result = await lookupArea(address);
      onRefresh(house.id, result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Area info">
        <div className="modal-header">
          <span className="modal-title">📍 {house.address}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {house.zip && <div className="area-modal-sub">{house.zip}</div>}

          {area ? (
            <AreaPanel area={area} />
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-icon">📍</div>
              <p>No area info yet for this house.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Looking up…' : area ? '↻ Refresh' : 'Look up area'}
          </button>
        </div>
      </div>
    </div>
  );
}
