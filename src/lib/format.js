export const money = (n) =>
  n ? '$' + Number(n).toLocaleString() : '—';

export const perSqft = (price, sqft) =>
  price && sqft ? '$' + Math.round(price / sqft) : '—';

export const statBeds  = (n) => (n ? `${n} bd`  : '—');
export const statBaths = (n) => (n ? `${n} ba`  : '—');
export const statSqft  = (n) => (n ? Number(n).toLocaleString() + ' sf' : '—');

export function fmt12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function suggestWindow(openStart) {
  if (!openStart) return '';
  const [h, m] = openStart.split(':').map(Number);
  const start = new Date(2000, 0, 1, h, m);
  const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const endH  = end.getHours();
  const endM  = end.getMinutes();
  const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  return `${fmt12(openStart)} – ${fmt12(endStr)}`;
}
