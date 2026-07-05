import { useState } from 'react';
import { perSqft, suggestWindow } from '../lib/format';
import { lookupArea, fetchListing } from '../lib/area';
import PhotoUpload from '../components/PhotoUpload';
import AreaPanel from '../components/AreaPanel';

const EMPTY = {
  address: '', zip: '', price: '', beds: '', baths: '', sqft: '',
  style: '', tagline: '', notes: '', openTime: '', openStart: '', photo: '',
  tourDate: '', areaData: null,
};

export default function HouseForm({ house, onSave, onCancel }) {
  const [form, setForm] = useState(house ? {
    ...house,
    price: house.price || '',
    beds:  house.beds  || '',
    baths: house.baths || '',
    sqft:  house.sqft  || '',
  } : EMPTY);

  const set = (key) => (e) => {
    const val = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'openStart' && !f.openTime) {
        next.openTime = suggestWindow(val);
      }
      return next;
    });
  };
  const setPhoto = (photo) => setForm((f) => ({ ...f, photo }));

  const [areaLoading, setAreaLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importState, setImportState] = useState(null); // null | 'loading' | 'ok' | {error}

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImportState('loading');
    const result = await fetchListing(importUrl.trim());
    if (!result.ok) {
      setImportState({
        error:
          result.reason === 'blocked'
            ? `${result.host || 'That site'} blocked the import. Tip: right-click the listing photo → “Copy image address”, paste it into the Photo box below, and fill the rest in.`
            : "Couldn't read that listing — enter the details manually below (photo box takes an image link too).",
      });
      return;
    }
    const L = result.listing;
    setForm((f) => ({
      ...f,
      address: L.address || f.address,
      zip: L.zip || f.zip,
      price: L.price != null ? String(L.price) : f.price,
      beds: L.beds != null ? String(L.beds) : f.beds,
      baths: L.baths != null ? String(L.baths) : f.baths,
      sqft: L.sqft != null ? String(L.sqft) : f.sqft,
      photo: L.photo || f.photo,
    }));
    setImportState('ok');
  };

  const handleLookup = async () => {
    const address = [form.address, form.zip].filter(Boolean).join(', ').trim();
    if (!address) {
      alert('Enter an address first.');
      return;
    }
    setAreaLoading(true);
    try {
      const result = await lookupArea(address);
      setForm((f) => ({ ...f, areaData: result }));
    } finally {
      setAreaLoading(false);
    }
  };

  const ppsqft = form.price && form.sqft
    ? '$' + Math.round(Number(form.price) / Number(form.sqft)) + '/sf'
    : '—';

  const handleSave = () => {
    if (!form.address.trim()) {
      alert('Address is required.');
      return;
    }
    onSave({
      ...(house || {}),
      ...form,
      price: Number(form.price) || 0,
      beds:  Number(form.beds)  || 0,
      baths: Number(form.baths) || 0,
      sqft:  Number(form.sqft)  || 0,
      areaData: form.areaData ?? house?.areaData ?? null,
      scores: house?.scores || { first: 0, layout: 0, kitchen: 0, yard: 0, vibe: 0 },
      toured: house?.toured || false,
    });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-label={house?.id ? 'Edit house' : 'Add house'}>
        <div className="modal-header">
          <span className="modal-title">{house?.id ? 'Edit House' : 'Add House'}</span>
          <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {/* Quick import from a listing URL (Redfin works best) */}
          <div className="import-box">
            <span className="form-section-label">Import from listing</span>
            <div className="import-row">
              <input
                className="form-input"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="Paste a Redfin listing URL…"
                inputMode="url"
              />
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={handleImport}
                disabled={importState === 'loading'}
              >
                {importState === 'loading' ? '…' : 'Import'}
              </button>
            </div>
            {importState === 'ok' && <span className="import-msg import-msg--ok">✓ Filled in below — review &amp; adjust, then save.</span>}
            {importState?.error && <span className="import-msg import-msg--err">{importState.error}</span>}
            <span className="form-hint">Best effort — listing sites often block bots. If it fails, paste the photo link in the Photo box below and fill the rest in.</span>
          </div>

          <hr className="divider" />

          {/* Photo */}
          <div className="form-row">
            <span className="form-label">Photo</span>
            <PhotoUpload value={form.photo} onChange={setPhoto} />
          </div>

          <hr className="divider" />
          <span className="form-section-label">Property details</span>

          <div className="form-row">
            <label className="form-label" htmlFor="f-address">Address *</label>
            <input id="f-address" className="form-input" value={form.address} onChange={set('address')} placeholder="918 Glen Oaks Blvd" />
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="f-zip">City / Zip</label>
            <input id="f-zip" className="form-input" value={form.zip} onChange={set('zip')} placeholder="Dallas, TX 75232" />
          </div>

          <div className="form-row">
            <button className="btn btn-ghost btn-sm" type="button" onClick={handleLookup} disabled={areaLoading}>
              {areaLoading ? 'Looking up area…' : form.areaData ? '↻ Refresh area info' : '📍 Look up area info'}
            </button>
            <span className="form-hint">Pulls income, schools, walkability &amp; more for this address.</span>
          </div>
          {form.areaData && <AreaPanel area={form.areaData} />}

          <div className="form-row">
            <label className="form-label" htmlFor="f-price">Price ($)</label>
            <input id="f-price" className="form-input" type="number" min="0" value={form.price} onChange={set('price')} placeholder="535000" />
          </div>
          <div className="form-row-2">
            <div className="form-row">
              <label className="form-label" htmlFor="f-beds">Beds</label>
              <input id="f-beds" className="form-input" type="number" min="0" value={form.beds} onChange={set('beds')} placeholder="3" />
            </div>
            <div className="form-row">
              <label className="form-label" htmlFor="f-baths">Baths</label>
              <input id="f-baths" className="form-input" type="number" min="0" step="0.5" value={form.baths} onChange={set('baths')} placeholder="2" />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-row">
              <label className="form-label" htmlFor="f-sqft">Sqft</label>
              <input id="f-sqft" className="form-input" type="number" min="0" value={form.sqft} onChange={set('sqft')} placeholder="2000" />
            </div>
            <div className="form-row">
              <span className="form-label">$/sf</span>
              <input className="form-input readonly" value={ppsqft} readOnly />
            </div>
          </div>

          <hr className="divider" />
          <span className="form-section-label">Character</span>

          <div className="form-row">
            <label className="form-label" htmlFor="f-style">Style</label>
            <input id="f-style" className="form-input" value={form.style} onChange={set('style')} placeholder="Mid-Century Modern" />
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="f-tagline">Tagline</label>
            <input id="f-tagline" className="form-input" value={form.tagline} onChange={set('tagline')} placeholder="The character pick" />
          </div>

          <hr className="divider" />
          <span className="form-section-label">Tour date &amp; open house</span>

          <div className="form-row">
            <label className="form-label" htmlFor="f-tourdate">Tour date</label>
            <input id="f-tourdate" className="form-input" type="date" value={form.tourDate} onChange={set('tourDate')} />
            <span className="form-hint">Group houses by the day you toured them.</span>
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label className="form-label" htmlFor="f-openstart">Start time</label>
              <input id="f-openstart" className="form-input" type="time" value={form.openStart} onChange={set('openStart')} />
            </div>
            <div className="form-row">
              <label className="form-label" htmlFor="f-opentime">Display label</label>
              <input id="f-opentime" className="form-input" value={form.openTime} onChange={set('openTime')} placeholder="1:00 PM – 3:00 PM" />
            </div>
          </div>

          <hr className="divider" />
          <span className="form-section-label">Notes</span>

          <div className="form-row">
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={set('notes')}
              placeholder="First impressions, deal-breakers, what stood out…"
              rows={4}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {house?.id ? 'Save changes' : 'Add house'}
          </button>
        </div>
      </div>
    </div>
  );
}
