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

      if (error) throw error;

      const households = (data ?? [])
        .map((m: any) => m.household)
        .filter(Boolean) as Household[];

      set({ households });

      // Sélectionner le premier foyer si aucun n'est sélectionné
      if (!get().currentHousehold && households.length > 0) {
        set({ currentHousehold: households[0] });
      }
    } finally {
      set({ loading: false });
    }
  },

  setCurrentHousehold: (household) => {
    set({ currentHousehold: household });
  },

  fetchMembers: async (householdId) => {
    const { data, error } = await supabase
      .from('household_memberships')
      .select('*, profile:profiles(*)')
      .eq('household_id', householdId);

    if (error) throw error;
    set({ members: data ?? [] });
  },

  createHousehold: async (name, userId) => {
    // Créer le foyer
    const { data: household, error: hError } = await supabase
      .from('households')
      .insert({ name })
      .select()
      .single();

    if (hError) throw hError;

    // Ajouter l'utilisateur comme admin
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
