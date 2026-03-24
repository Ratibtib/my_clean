// ============================================================
// CHORIFY — Hook useStreak (avec realtime)
// ============================================================

import { useEffect, useRef } from 'react';
import { useStreakStore } from '../store/useStreakStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { supabase } from '../services/supabase';

/**
 * Hook qui gère le streak et écoute les changements en temps réel.
 * À utiliser dans le composant racine ou un layout persistant.
 */
export function useStreak() {
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);
  const { streak, fetchStreak, loading } = useStreakStore();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!currentHousehold) return;

    // Fetch initial
    fetchStreak(currentHousehold.id);

    // Écouter les nouvelles réalisations pour recalculer le streak
    const channel = supabase
      .channel(`streak-${currentHousehold.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_completions',
        },
        () => {
          // Recalculer le streak quand une réalisation change
          fetchStreak(currentHousehold.id);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [currentHousehold?.id]);

  return { streak, loading };
}
