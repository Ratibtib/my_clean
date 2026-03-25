import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { Session } from '@supabase/supabase-js';

// Targets matching the hardcoded FloorPlan SVG
const DEFAULT_TARGETS = [
  { name: 'Chambre 1', type: 'zone', position_x: 66, position_y: 86 },
  { name: 'Salle de bain', type: 'zone', position_x: 155, position_y: 60 },
  { name: 'Cuisine', type: 'zone', position_x: 297, position_y: 60 },
  { name: 'Entrée', type: 'zone', position_x: 359, position_y: 60 },
  { name: 'Couloir', type: 'zone', position_x: 155, position_y: 163 },
  { name: 'Chambre 2', type: 'zone', position_x: 66, position_y: 239 },
  { name: 'Salon / SAM', type: 'zone', position_x: 260, position_y: 209 },
  { name: 'Balcon', type: 'zone', position_x: 359, position_y: 269 },
  { name: 'Four', type: 'equipment', position_x: 278, position_y: 86 },
  { name: 'Frigo', type: 'equipment', position_x: 316, position_y: 34 },
  { name: 'Lave-linge', type: 'equipment', position_x: 174, position_y: 30 },
  { name: 'WC', type: 'equipment', position_x: 142, position_y: 128 },
];

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  ensureProfile: (userId: string, email: string, displayName: string) => Promise<void>;
  setupDefaultHousehold: (userId: string, displayName: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session });
      if (session?.user) {
        await get().fetchProfile();
      }
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session });
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });
    } catch (e) {
      console.warn('Auth init error:', e);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    if (data?.user) {
      await get().ensureProfile(data.user.id, email, displayName);
      await get().setupDefaultHousehold(data.user.id, displayName);
    }
  },

  ensureProfile: async (userId, email, displayName) => {
    try {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('id', userId).single();
      if (!existing) {
        await supabase.from('profiles').insert({
          id: userId, email, display_name: displayName,
        });
      }
    } catch (e) {
      console.warn('Profile ensure:', e);
    }
  },

  setupDefaultHousehold: async (userId, displayName) => {
    try {
      // Create default household
      const householdName = `Foyer de ${displayName}`;
      const { data: household, error: hErr } = await supabase
        .from('households').insert({ name: householdName }).select().single();
      if (hErr || !household) return;

      // Add user as admin
      await supabase.from('household_memberships').insert({
        user_id: userId, household_id: household.id, role: 'admin',
      });

      // Seed all default targets
      const targets = DEFAULT_TARGETS.map((t) => ({
        household_id: household.id,
        name: t.name,
        type: t.type,
        position_x: t.position_x,
        position_y: t.position_y,
        parent_id: null,
        icon: null,
      }));
      await supabase.from('targets').insert(targets);
    } catch (e) {
      console.warn('Setup default household error:', e);
    }
  },

  signOut: async () => {
    try { await supabase.auth.signOut(); }
    catch (e) { console.warn('Sign out error:', e); }
    set({ session: null, profile: null });
  },

  fetchProfile: async () => {
    try {
      const userId = get().session?.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from('profiles').select('*').eq('id', userId).single();
      if (data) set({ profile: data });
    } catch (e) {
      console.warn('Profile fetch error:', e);
    }
  },
}));
