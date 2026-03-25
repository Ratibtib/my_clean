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
  ensureProfile: (userId: string, email: string, displayName: string) => Promise<void>;
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

    // Create profile manually (backup if trigger fails)
    if (data?.user) {
      await get().ensureProfile(data.user.id, email, displayName);
    }
  },

  ensureProfile: async (userId, email, displayName) => {
    try {
      // Check if profile already exists (trigger may have created it)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existing) {
        // Create profile if trigger didn't
        await supabase.from('profiles').insert({
          id: userId,
          email: email,
          display_name: displayName,
        });
      }
    } catch (e) {
      // Profile might already exist from trigger — that's fine
      console.warn('Profile ensure:', e);
    }
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
