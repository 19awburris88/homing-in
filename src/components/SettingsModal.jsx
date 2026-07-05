import { useState } from 'react';

export default function SettingsModal({ settings, onSave, onClose, onSignOut }) {
  const [vibeLabel, setVibeLabel] = useState(settings.vibeLabel);

  const handleSave = () => {
    onSave({ vibeLabel: vibeLabel.trim() || "Adrienne's vibe" });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Settings">
        <div className="modal-header">
          <span className="modal-title">Settings</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <div className="settings-field">
            <label className="form-label" htmlFor="vibe-label">Partner vibe label</label>
            <input
              id="vibe-label"
              className="form-input"
              value={vibeLabel}
              onChange={(e) => setVibeLabel(e.target.value)}
              placeholder="e.g. Adrienne's vibe"
            />
            <span className="form-hint">The 5th rating category label shown on every card.</span>
          </div>

          {onSignOut && (
            <>
              <hr className="divider" />
              <div className="settings-field">
                <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onSignOut}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
