/**
 * Tema visual: navy + emas di atas krem, font Plus Jakarta Sans, motif kawung.
 * Mengikuti prototipe desain "Jelajah" (canvas Design).
 */
export const colors = {
  navy: '#22306A',
  navyDeep: '#1C2758',
  navyRing: '#26336B',
  navySoft: '#E9ECF6',
  gold: '#D9A441',
  goldLight: '#F3D58C',
  goldSoft: '#F4E3BF',
  goldInk: '#8A5A0F',
  goldInkDark: '#6E470B',
  bg: '#FAF7F2',
  card: '#FFFFFF',
  sand: '#EFEAE0',
  line: '#E2DACB',
  border: '#E8E2D6',
  text: '#1A1814',
  body: '#2B2823',
  muted: '#5E5A52',
  muted2: '#6B665C',
  onNavy: '#D3D8EC',
  success: '#2F7D4F',
  successSoft: '#E5F2EA',
  successInk: '#22603C',
  danger: '#B3261E',
  dangerSoft: '#FBE9E7',
  dangerInk: '#8C1D18',
};
// Alias lama supaya komponen lain tetap jalan.
colors.primary = colors.navy;

export const font = {
  regular: { fontFamily: 'PlusJakartaSans_400Regular' },
  medium: { fontFamily: 'PlusJakartaSans_500Medium' },
  semibold: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  bold: { fontFamily: 'PlusJakartaSans_700Bold' },
  extrabold: { fontFamily: 'PlusJakartaSans_800ExtraBold' },
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 20, xxl: 24 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

/** Label, warna, dan ikon per status era/bab dari backend. */
export const statusStyle = {
  locked: { label: 'Terkunci', color: colors.muted, bg: colors.sand, icon: 'lock-closed' },
  unlocked: { label: 'Berjalan', color: colors.navy, bg: colors.navySoft, icon: 'play' },
  available: { label: 'Siap dipelajari', color: colors.muted, bg: colors.sand, icon: 'ellipse-outline' },
  not_started: { label: 'Belum mulai', color: colors.muted, bg: colors.sand, icon: 'ellipse-outline' },
  in_progress: { label: 'Sedang belajar', color: colors.goldInk, bg: colors.goldSoft, icon: 'time' },
  completed: { label: 'Selesai', color: colors.successInk, bg: colors.successSoft, icon: 'checkmark-circle' },
  skipped: { label: 'Dilewati', color: colors.navy, bg: colors.navySoft, icon: 'play-skip-forward' },
};

export function initials(name = '?') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
