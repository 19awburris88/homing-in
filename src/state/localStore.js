import { useReducer, useEffect, useState } from 'react';
import { newId } from '../lib/id';
import { SEED_HOUSES, DEFAULT_SETTINGS, normalizeHouse } from './model';

// Browser-only store (no Supabase keys set). Keeps the original localStorage
// format so any data already saved on this device is preserved.

const STORAGE_KEY    = 'houseTour.v1';
const WARN_THRESHOLD = 4 * 1024 * 1024;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, houses: SEED_HOUSES, settings: DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    const houses = (parsed.houses || []).map(normalizeHouse);
    return {
      version: 1,
      houses,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    return { version: 1, houses: SEED_HOUSES, settings: DEFAULT_SETTINGS };
  }
}

function reducer(state, action) {
  const now = Date.now();
  switch (action.type) {
    case 'ADD_HOUSE':
      return { ...state, houses: [...state.houses, action.house] };
    case 'UPDATE_HOUSE':
      return {
        ...state,
        houses: state.houses.map((h) =>
          h.id === action.house.id ? { ...action.house, updatedAt: now } : h
        ),
      };
    case 'DELETE_HOUSE':
      return { ...state, houses: state.houses.filter((h) => h.id !== action.id) };
    case 'DUPLICATE_HOUSE': {
      const orig = state.houses.find((h) => h.id === action.id);
      if (!orig) return state;
      return {
        ...state,
        houses: [
          ...state.houses,
          { ...orig, id: newId(), toured: false, createdAt: now, updatedAt: now },
        ],
      };
    }
    case 'UPDATE_SCORE':
      return {
        ...state,
        houses: state.houses.map((h) =>
          h.id === action.id
            ? { ...h, scores: { ...h.scores, [action.key]: action.value }, updatedAt: now }
            : h
        ),
      };
    case 'UPDATE_NOTES':
      return {
        ...state,
        houses: state.houses.map((h) =>
          h.id === action.id ? { ...h, notes: action.notes, updatedAt: now } : h
        ),
      };
    case 'UPDATE_AREA':
      return {
        ...state,
        houses: state.houses.map((h) =>
          h.id === action.id ? { ...h, areaData: action.areaData, updatedAt: now } : h
        ),
      };
    case 'TOGGLE_TOURED':
      return {
        ...state,
        houses: state.houses.map((h) =>
          h.id === action.id ? { ...h, toured: !h.toured } : h
        ),
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    default:
      return state;
  }
}

export function useLocalHouses() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [storageStatus, setStorageStatus] = useState('ok');

  useEffect(() => {
    try {
      const json = JSON.stringify(state);
      setStorageStatus(json.length > WARN_THRESHOLD ? 'warn' : 'ok');
      localStorage.setItem(STORAGE_KEY, json);
    } catch {
      setStorageStatus('error');
    }
  }, [state]);

  return {
    houses: state.houses,
    settings: state.settings,
    storageStatus,
    syncStatus: 'local',
    addHouse:      (h)        => dispatch({ type: 'ADD_HOUSE',      house: { ...h, id: newId(), createdAt: Date.now(), updatedAt: Date.now() } }),
    updateHouse:   (h)        => dispatch({ type: 'UPDATE_HOUSE',   house: h }),
    deleteHouse:   (id)       => dispatch({ type: 'DELETE_HOUSE',   id }),
    duplicateHouse:(id)       => dispatch({ type: 'DUPLICATE_HOUSE',id }),
    updateScore:   (id,k,v)   => dispatch({ type: 'UPDATE_SCORE',   id, key: k, value: v }),
    updateNotes:   (id,notes) => dispatch({ type: 'UPDATE_NOTES',   id, notes }),
    updateArea:    (id,areaData) => dispatch({ type: 'UPDATE_AREA', id, areaData }),
    toggleToured:  (id)       => dispatch({ type: 'TOGGLE_TOURED',  id }),
    updateSettings:(s)        => dispatch({ type: 'UPDATE_SETTINGS',settings: s }),
  };
}
