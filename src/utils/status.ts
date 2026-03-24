// ============================================================
// CHORIFY — Logique de statut
// ============================================================

import { TaskStatus } from '../types';

/**
 * Calcule le ratio de progression d'une tâche.
 * 0 = vient d'être faite, 1 = délai atteint.
 */
export function getProgressRatio(
  lastCompletedAt: string | null,
  createdAt: string,
  maxIntervalDays: number
): number {
  const reference = lastCompletedAt ? new Date(lastCompletedAt) : new Date(createdAt);
  const now = new Date();
  const elapsedMs = now.getTime() - reference.getTime();
  const maxMs = maxIntervalDays * 24 * 60 * 60 * 1000;
  return Math.max(0, elapsedMs / maxMs);
}

/**
 * Dérive le statut depuis le ratio.
 */
export function getStatus(ratio: number): TaskStatus {
  if (ratio <= 0.6) return 'green';
  if (ratio <= 0.9) return 'orange';
  return 'red';
}

/**
 * Calcule le nombre de jours restants avant le rouge.
 */
export function getDaysRemaining(
  lastCompletedAt: string | null,
  createdAt: string,
  maxIntervalDays: number
): number {
  const reference = lastCompletedAt ? new Date(lastCompletedAt) : new Date(createdAt);
  const deadline = new Date(reference.getTime() + maxIntervalDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const remaining = (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  return Math.round(remaining * 10) / 10;
}

/**
 * Texte lisible pour le statut.
 */
export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'green': return 'À jour';
    case 'orange': return 'Bientôt';
    case 'red': return 'En retard';
  }
}

/**
 * Priorité pour le tri (rouge d'abord).
 */
export function getStatusPriority(status: TaskStatus): number {
  switch (status) {
    case 'red': return 0;
    case 'orange': return 1;
    case 'green': return 2;
  }
}
