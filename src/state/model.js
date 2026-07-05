import { newId } from '../lib/id';

// Shared house shape + seed data + settings persistence, used by both the
// local (browser-only) and cloud (Supabase) stores.

export function seed(overrides) {
  return {
    id: newId(),
    address: '', zip: '', price: 0, beds: 0, baths: 0, sqft: 0,
    style: '', tagline: '', notes: '',
    openTime: '', openStart: '', photo: '',
    tourDate: '', areaData: null,
    scores: { first: 0, layout: 0, kitchen: 0, yard: 0, vibe: 0 },
    toured: false,
    createdAt: Date.now(), updatedAt: Date.now(),
    ...overrides,
  };
}

export const SEED_HOUSES = [
  seed({ address: '918 Glen Oaks Blvd',  zip: 'Dallas, TX 75232', price: 535000, beds: 3, baths: 3, sqft: 2042, style: 'Mid-Century Modern',       tagline: 'The character pick', openTime: '1:00 PM – 3:00 PM', openStart: '13:00', photo: '/photos/glenoaks.webp', tourDate: '2026-06-21' }),
  seed({ address: '2626 Bainbridge Dr',   zip: 'Dallas, TX 75237', price: 619000, beds: 5, baths: 4, sqft: 2523, style: 'Modern Farmhouse (new)',     tagline: 'The most space',     openTime: '1:00 PM – 3:00 PM', openStart: '13:00', photo: '/photos/2626.webp',     tourDate: '2026-06-21' }),
  seed({ address: '2622 Bainbridge Dr',   zip: 'Dallas, TX 75237', price: 605000, beds: 5, baths: 4, sqft: 2640, style: 'Modern Farmhouse (new)',     tagline: 'The value play',     openTime: '1:00 PM – 3:00 PM', openStart: '13:00', photo: '/photos/2622.webp',     tourDate: '2026-06-21' }),
  seed({ address: '3060 Timberview Rd',   zip: 'Dallas, TX 75229', price: 635000, beds: 4, baths: 3, sqft: 2454, style: 'Updated Traditional (1963)', tagline: 'The hot listing',    openTime: '3:00 PM – 5:00 PM', openStart: '15:00', photo: '/photos/3060.webp',     tourDate: '2026-06-21' }),
];

export const DEFAULT_SETTINGS = { vibeLabel: "Adrienne's vibe" };

// Settings are tiny (just a label) and stay in localStorage in both modes.
const SETTINGS_KEY = 'houseTour.settings';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

// Normalize any stored/fetched house so older records gain newer fields.
export function normalizeHouse(h) {
  return { tourDate: '', areaData: null, ...h };
}
