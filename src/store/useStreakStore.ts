// ============================================================
// CHORIFY — Store Streak (Zustand)
// ============================================================

import { create } from 'zustand';
import { fetchHouseholdStreak } from '../services/tasks';

interface StreakState {
  streak: number;
  loading: boolean;
  fetchStreak: (householdId: string) => Promise<void>;
}

export const useStreakStore = create<StreakState>((set) => ({
  streak: 0,
  loading: false,

  fetchStreak: async (householdId) => {
    set({ loading: true });
    try {
      const streak = await fetchHouseholdStreak(householdId);
      set({ streak });
    } finally {
      set({ loading: false });
    }
  },
}));
