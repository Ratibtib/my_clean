// ============================================================
// CHORIFY — Hook useRealtime (sync multi-utilisateurs)
// ============================================================

import { useEffect, useRef } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { useStreakStore } from '../store/useStreakStore';
import { supabase } from '../services/supabase';

/**
 * Écoute les changements en temps réel sur les tables critiques
 * et rafraîchit les stores automatiquement.
 *
 * À monter une seule fois dans le composant racine.
 */
export function useRealtime() {
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);
  const refresh = useTaskStore((s) => s.refresh);
  const fetchCompletions = useTaskStore((s) => s.fetchCompletions);
  const fetchStreak = useStreakStore((s) => s.fetchStreak);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!currentHousehold) return;

    const householdId = currentHousehold.id;

    const channel = supabase
      .channel(`household-${householdId}`)
      // Écouter les nouvelles réalisations
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_completions',
        },
        () => {
          refresh(householdId);
          fetchCompletions(householdId);
          fetchStreak(householdId);
        }
      )
      // Écouter les suppressions de réalisations
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'task_completions',
        },
        () => {
          refresh(householdId);
          fetchCompletions(householdId);
          fetchStreak(householdId);
        }
      )
      // Écouter les changements de définitions de tâches
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_definitions',
        },
        () => {
          refresh(householdId);
        }
      )
      // Écouter les changements de cibles
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'targets',
        },
        () => {
          refresh(householdId);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentHousehold?.id]);
}
