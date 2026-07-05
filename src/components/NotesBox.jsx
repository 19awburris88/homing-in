import { useState, useEffect } from 'react';

export default function NotesBox({ houseId, value, onSave }) {
  const [text, setText] = useState(value || '');

  useEffect(() => {
    setText(value || '');
  }, [houseId]);

  useEffect(() => {
    const t = setTimeout(() => onSave(text), 400);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div className="card-notes">
      <div className="notes-label">Notes</div>
      <textarea
        className="notes-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Walkthrough notes, impressions…"
      />
    </div>
  );
}
