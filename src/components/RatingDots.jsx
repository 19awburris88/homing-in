export default function RatingDots({ label, value, onChange }) {
  return (
    <div className="rating-row">
      <span className="rating-label">{label}</span>
      <div className="rating-dots">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`dot${n <= (value || 0) ? ' filled' : ''}`}
            onClick={() => onChange(n === value ? 0 : n)}
            aria-label={`Rate ${n}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
