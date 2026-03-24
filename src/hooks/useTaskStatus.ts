// ============================================================
// CHORIFY — Hook useTaskStatus
// ============================================================

import { useMemo } from 'react';
import { TaskStatus } from '../types';
import { getProgressRatio, getStatus, getDaysRemaining } from '../utils/status';

interface TaskStatusInput {
  lastCompletedAt: string | null;
  createdAt: string;
  maxIntervalDays: number;
}

interface TaskStatusResult {
  ratio: number;
  status: TaskStatus;
  daysRemaining: number;
  isOverdue: boolean;
  percentComplete: number;
}

/**
 * Hook pour calculer le statut d'une tâche côté client.
 * Utile pour les mises à jour optimistic avant que le serveur ne réponde.
 */
export function useTaskStatus({
  lastCompletedAt,
  createdAt,
  maxIntervalDays,
}: TaskStatusInput): TaskStatusResult {
  return useMemo(() => {
    const ratio = getProgressRatio(lastCompletedAt, createdAt, maxIntervalDays);
    const status = getStatus(ratio);
    const daysRemaining = getDaysRemaining(lastCompletedAt, createdAt, maxIntervalDays);

    return {
      ratio,
      status,
      daysRemaining,
      isOverdue: daysRemaining <= 0,
      percentComplete: Math.min(Math.round(ratio * 100), 100),
    };
  }, [lastCompletedAt, createdAt, maxIntervalDays]);
}
