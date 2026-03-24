// ============================================================
// CHORIFY — Store Foyer (Zustand)
// ============================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Household, HouseholdMembership } from '../types';

interface HouseholdState {
  households: Household[];
  currentHousehold: Household | null;
  members: HouseholdMembership[];
  loading: boolean;

  fetchHouseholds: (userId: string) => Promise<void>;
  setCurrentHousehold: (household: Household) => void;
  fetchMembers: (householdId: string) => Promise<void>;
  createHousehold: (name: string, userId: string) => Promise<Household>;
  joinHousehold: (householdId: string, userId: string) => Promise<void>;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  households: [],
  currentHousehold: null,
  members: [],
  loading: false,

  fetchHouseholds: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('household_memberships')
        .select('*, household:households(*)')
        .eq('user_id', userId);

      if (error) {
        console.warn('Fetch households error:', error);
        return;
      }

      const households = (data ?? [])
        .map((m: any) => m?.household)
        .filter(Boolean) as Household[];

      set({ households });

      if (!get().currentHousehold && households.length > 0) {
        set({ currentHousehold: households[0] });
      }
    } catch (e) {
      console.warn('Fetch households error:', e);
    } finally {
      set({ loading: false });
    }
  },

  setCurrentHousehold: (household) => {
    set({ currentHousehold: household });
  },

  fetchMembers: async (householdId) => {
    try {
      const { data, error } = await supabase
        .from('household_memberships')
        .select('*, profile:profiles(*)')
        .eq('household_id', householdId);

      if (error) {
        console.warn('Fetch members error:', error);
        return;
      }
      set({ members: data ?? [] });
    } catch (e) {
      console.warn('Fetch members error:', e);
    }
  },

  createHousehold: async (name, userId) => {
    const { data: household, error: hError } = await supabase
      .from('households')
      .insert({ name })
      .select()
      .single();

    if (hError) throw hError;

    const { error: mError } = await supabase
      .from('household_memberships')
      .insert({
        user_id: userId,
        household_id: household.id,
        role: 'admin',
      });

    if (mError) throw mError;

    set((state) => ({
      households: [...state.households, household],
      currentHousehold: household,
    }));

    return household;
  },

  joinHousehold: async (householdId, userId) => {
    const { error } = await supabase
      .from('household_memberships')
      .insert({
        user_id: userId,
        household_id: householdId,
        role: 'member',
      });

    if (error) throw error;
    await get().fetchHouseholds(userId);
  },
}));
