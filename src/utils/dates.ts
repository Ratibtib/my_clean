// ============================================================
// CHORIFY — Helpers date
// ============================================================

/**
 * Formatage relatif : "il y a 2h", "il y a 3j", etc.
 */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  if (diffD < 30) return `il y a ${Math.floor(diffD / 7)}sem`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Format court pour l'agenda : "Lun 23 Mars"
 */
export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format complet : "23 mars 2026 à 14:30"
 */
export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ' à ' + d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcule la date prévisionnelle de la prochaine échéance.
 */
export function getNextDeadline(
  lastCompletedAt: string | null,
  createdAt: string,
  maxIntervalDays: number
): Date {
  const ref = lastCompletedAt ? new Date(lastCompletedAt) : new Date(createdAt);
  return new Date(ref.getTime() + maxIntervalDays * 24 * 60 * 60 * 1000);
}

/**
 * Vérifie si une date est aujourd'hui.
 */
export function isToday(date: Date): boolean {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}
