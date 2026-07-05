import { isCloud } from '../lib/supabase';
import { useLocalHouses } from './localStore';
import { useCloudHouses } from './cloudStore';

// Pick the store implementation once, at load time, based on whether Supabase
// is configured. Both hooks expose the same API, so the rest of the app is
// unchanged. Assigning the hook to a stable name keeps the Rules of Hooks happy.
export const useHouses = isCloud ? useCloudHouses : useLocalHouses;
