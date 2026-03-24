// ============================================================
// CHORIFY — Palette & Thème
// ============================================================

import { TaskStatus } from '../types';

export const COLORS = {
  // Statuts — l'information principale
  green: '#22C55E',
  greenLight: '#DCFCE7',
  greenDark: '#166534',

  orange: '#F59E0B',
  orangeLight: '#FEF3C7',
  orangeDark: '#92400E',

  red: '#EF4444',
  redLight: '#FEE2E2',
  redDark: '#991B1B',

  // Neutres
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F4',
  border: '#E7E5E4',
  borderLight: '#F5F5F4',

  // Texte
  text: '#1C1917',
  textSecondary: '#78716C',
  textTertiary: '#A8A29E',

  // Accents
  primary: '#1C1917',
  primaryLight: '#292524',

  // Streak
  streak: '#8B5CF6',
  streakLight: '#EDE9FE',
} as const;

export const STATUS_COLORS: Record<TaskStatus, { main: string; light: string; dark: string }> = {
  green: { main: COLORS.green, light: COLORS.greenLight, dark: COLORS.greenDark },
  orange: { main: COLORS.orange, light: COLORS.orangeLight, dark: COLORS.orangeDark },
  red: { main: COLORS.red, light: COLORS.redLight, dark: COLORS.redDark },
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  mono: 'SpaceMono',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
