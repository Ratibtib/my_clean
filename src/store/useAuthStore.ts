// ============================================================
// CHORIFY — Store Auth (Zustand)
// ============================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    set({ session: null, profile: null });
  },

  fetchProfile: async () => {
    try {
      const userId = get().session?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) set({ profile: data });
    } catch (e) {
      console.warn('Profile fetch error:', e);
    }
  },
}));
