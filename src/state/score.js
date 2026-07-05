export const CATEGORIES = [
  { key: 'first',   label: 'First impression' },
  { key: 'layout',  label: 'Layout / flow'    },
  { key: 'kitchen', label: 'Kitchen'           },
  { key: 'yard',    label: 'Yard / lot'        },
  { key: 'vibe',    label: 'Vibe'              },
];

export const total = (scores) =>
  scores ? CATEGORIES.reduce((s, c) => s + (scores[c.key] || 0), 0) : 0;

export const findWinners = (houses) => {
  if (!houses?.length) return [];
  const totals = houses.map((h) => total(h.scores));
  const max = Math.max(...totals);
  if (max === 0) return [];
  return houses.filter((_, i) => totals[i] === max).map((h) => h.id);
};
