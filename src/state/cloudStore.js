import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { newId } from '../lib/id';
import { loadSettings, saveSettings, normalizeHouse } from './model';

// Supabase-backed store. One shared list of houses, synced across devices via
// realtime. Same API surface as useLocalHouses so the app doesn't care which
// mode it's in. Settings (just the vibe label) stay in localStorage.

const byCreated = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
const iso = () => new Date().toISOString();

async function upsertRow(house) {
  return supabase.from('houses').upsert({ id: house.id, data: house, updated_at: iso() });
}

export function useCloudHouses() {
  const [houses, setHouses] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [syncStatus, setSyncStatus] = useState('loading'); // loading | synced | error
  const housesRef = useRef(houses);
  housesRef.current = houses;

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase.from('houses').select('id,data').order('updated_at');
    if (error) { setSyncStatus('error'); return; }
    setHouses((data || []).map((r) => normalizeHouse(r.data)).sort(byCreated));
    setSyncStatus('synced');
  }, []);

  useEffect(() => {
    let active = true;

    // Load once we know there's a session; refetch whenever auth flips.
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) fetchAll();
    });
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) fetchAll();
      else setHouses([]);
    });

    // Realtime: any change to the shared table refetches so all devices agree.
    const channel = supabase
      .channel('houses-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, () => fetchAll())
      .subscribe();

    return () => {
      active = false;
      authSub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // Optimistic local update + write-through to Supabase; realtime reconciles.
  const persist = (house) => { upsertRow(house).catch(() => setSyncStatus('error')); };
  const mutateOne = (id, fn) => {
    const orig = housesRef.current.find((h) => h.id === id);
    if (!orig) return;
    const next = { ...fn(orig), updatedAt: Date.now() };
    setHouses((prev) => prev.map((h) => (h.id === id ? next : h)));
    persist(next);
  };

  return {
    houses,
    settings,
    storageStatus: 'ok',
    syncStatus,

    addHouse: (h) => {
      const house = { ...h, id: newId(), createdAt: Date.now(), updatedAt: Date.now() };
      setHouses((prev) => [...prev, house]);
      persist(house);
    },
    updateHouse: (h) => {
      const house = { ...h, updatedAt: Date.now() };
      setHouses((prev) => prev.map((x) => (x.id === house.id ? house : x)));
      persist(house);
    },
    deleteHouse: (id) => {
      setHouses((prev) => prev.filter((x) => x.id !== id));
      supabase.from('houses').delete().eq('id', id).then(({ error }) => { if (error) setSyncStatus('error'); });
    },
    duplicateHouse: (id) => {
      const orig = housesRef.current.find((h) => h.id === id);
      if (!orig) return;
      const copy = { ...orig, id: newId(), toured: false, createdAt: Date.now(), updatedAt: Date.now() };
      setHouses((prev) => [...prev, copy]);
      persist(copy);
    },
    updateScore: (id, k, v) => mutateOne(id, (h) => ({ ...h, scores: { ...h.scores, [k]: v } })),
    updateNotes: (id, notes) => mutateOne(id, (h) => ({ ...h, notes })),
    updateArea:  (id, areaData) => mutateOne(id, (h) => ({ ...h, areaData })),
    toggleToured:(id) => mutateOne(id, (h) => ({ ...h, toured: !h.toured })),
    updateSettings: (s) => setSettings((prev) => {
      const next = { ...prev, ...s };
      saveSettings(next);
      return next;
    }),
  };
}
