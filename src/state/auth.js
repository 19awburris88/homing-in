import { useState, useEffect } from 'react';
import { supabase, isCloud } from '../lib/supabase';

// Auth for cloud mode. In local mode it's a no-op that reports "signed in" so
// the app renders normally without a login screen.
const LOCAL_SESSION = { local: true };

export function useAuth() {
  const [session, setSession] = useState(isCloud ? null : LOCAL_SESSION);
  const [loading, setLoading] = useState(isCloud);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isCloud) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) setSession(s);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) { setError(err.message); return false; }
    return true;
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return { cloud: isCloud, session, loading, error, signIn, signOut };
}
