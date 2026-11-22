export const colors = {
  primary: '#7A1F2B', // merah marun
  primaryDark: '#5A1420',
  gold: '#C9A227',
  goldSoft: '#F6EBC8',
  bg: '#FBF7F0',
  card: '#FFFFFF',
  text: '#2B2118',
  muted: '#7A6E64',
  border: '#E9E0D2',
  success: '#2E7D4F',
  successSoft: '#E3F2E8',
  danger: '#B3261E',
  dangerSoft: '#FBE4E2',
  locked: '#A39B92',
  lockedSoft: '#EFEBE6',
};

export const radius = { sm: 8, md: 12, lg: 18 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

/** Warna, label, dan ikon per status era/bab dari backend. */
export const statusStyle = {
  locked: { label: 'Terkunci', color: colors.locked, bg: colors.lockedSoft, icon: 'lock-closed' },
  unlocked: { label: 'Terbuka', color: colors.primary, bg: colors.goldSoft, icon: 'lock-open' },
  not_started: { label: 'Belum mulai', color: colors.muted, bg: colors.lockedSoft, icon: 'ellipse-outline' },
  in_progress: { label: 'Sedang belajar', color: '#9A6B00', bg: colors.goldSoft, icon: 'time' },
  completed: { label: 'Selesai', color: colors.success, bg: colors.successSoft, icon: 'checkmark-circle' },
};
