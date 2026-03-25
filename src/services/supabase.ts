// ============================================================
// CHORIFY — Client Supabase
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://pcitusvszhpjdozpolho.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9UZQWp7FLUO57sE4AbASWQ_yLgGPQ75';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
