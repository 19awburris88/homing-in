import { useRef, useState } from 'react';
import { downscaleImage } from '../lib/image';

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

export default function PhotoUpload({ value, onChange }) {
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef();

  const addUrl = () => {
    const url = urlInput.trim();
    if (/^https?:\/\//i.test(url)) {
      onChange(url);
      setUrlInput('');
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const dataURL = await downscaleImage(file);
      onChange(dataURL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="photo-upload">
      {value ? (
        <div className="photo-preview">
          <img src={value} alt="House photo" />
          <button
            className="photo-remove"
            onClick={() => onChange('')}
            type="button"
            aria-label="Remove photo"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <div
            className="photo-dropzone"
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <CameraIcon />
            <span>{loading ? 'Processing…' : 'Tap to add photo'}</span>
          </div>
          <div className="photo-url-row">
            <input
              className="form-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              placeholder="…or paste an image link"
              inputMode="url"
            />
            <button className="btn btn-ghost btn-sm" type="button" onClick={addUrl} disabled={!urlInput.trim()}>
              Use
            </button>
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: 'none' }}
      />
    </div>
  );
}
