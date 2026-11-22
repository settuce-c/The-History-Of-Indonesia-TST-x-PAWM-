import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useFetch } from '../../lib/useFetch';
import { ErrorView, Loading, ProgressBar, SectionTitle } from '../../components/ui';
import { Kawung } from '../../components/Ornament';
import { colors, font, initials, radius, space } from '../../lib/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi,';
  if (h < 15) return 'Selamat siang,';
  if (h < 19) return 'Selamat sore,';
  return 'Selamat malam,';
}

/** Bab pertama yang belum selesai di era yang sedang terbuka. */
function findNext(eras) {
  for (const era of eras) {
    if (era.status !== 'unlocked') continue;
    const idx = era.chapters.findIndex((c) => c.status !== 'completed');
    if (idx >= 0) return { era, chapter: era.chapters[idx], index: idx };
  }
  return null;
}

const ERA_CHIP = {
  completed: { bg: colors.successSoft, label: 'SELESAI', labelColor: colors.successInk, title: colors.text },
  unlocked: { bg: colors.navy, label: 'BERJALAN', labelColor: colors.goldLight, title: '#FFFFFF' },
  locked: { bg: colors.sand, label: 'TERKUNCI', labelColor: colors.muted, title: colors.muted },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { data, error, loading, refreshing, refresh, reload } = useFetch(() => Api.progress());

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;

  const { summary, eras } = data;
  const next = findNext(eras);
  const nextPct = next ? (next.chapter.watched ? 50 : 0) + (next.chapter.passed ? 50 : 0) : 0;
  const remaining = summary.totalChapters - summary.completedChapters;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />}
      >
        {/* Sapaan */}
        <View style={styles.header}>
          <Pressable onPress={() => router.navigate('/profile')} accessibilityLabel="Buka profil" style={styles.avatar}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={StyleSheet.absoluteFill} />
            ) : (
              <Text style={styles.avatarText}>{initials(user?.name)}</Text>
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>{greeting()}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name || 'Pelajar'}
            </Text>
          </View>
        </View>

        {/* Kartu ringkasan */}
        <View style={styles.hero}>
          <Kawung size={140} style={{ right: -30, top: -30 }} />
          <View style={styles.heroTop}>
            <View style={{ gap: 4 }}>
              <Text style={styles.heroKicker}>Perjalanan belajar</Text>
              <Text style={styles.heroBig}>
                {summary.completedChapters}/{summary.totalChapters} bab
              </Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="medal" size={16} color={colors.gold} />
              <Text style={styles.heroPillText}>{summary.badgeCount} lencana</Text>
            </View>
          </View>
          <ProgressBar
            value={summary.completedChapters}
            total={summary.totalChapters}
            height={10}
            track="rgba(255,255,255,0.16)"
          />
          <Text style={styles.heroNote}>
            {remaining > 0 ? `${remaining} bab lagi untuk menamatkan semua era` : 'Semua bab sudah kamu selesaikan!'}
            {summary.averageScore != null ? ' · rata-rata ' : ''}
            {summary.averageScore != null && <Text style={{ color: '#FFFFFF', ...font.bold }}>{summary.averageScore}</Text>}
          </Text>
        </View>

        {/* Lanjutkan belajar */}
        {next && (
          <>
            <SectionTitle>Lanjutkan belajar</SectionTitle>
            <Pressable
              onPress={() => router.push(`/chapter/${next.chapter.id}`)}
              style={({ pressed }) => [styles.continueCard, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.continueIcon}>
                <Ionicons name="business-outline" size={32} color={colors.goldInk} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.continueMeta}>
                  {next.era.title} · Bab {next.index + 1} dari {next.era.chapters.length}
                </Text>
                <Text style={styles.continueTitle}>{next.chapter.title}</Text>
                <View style={styles.row}>
                  <ProgressBar value={nextPct} total={100} height={6} color={colors.navy} style={{ flex: 1 }} />
                  <Text style={styles.pct}>{nextPct}%</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          </>
        )}

        {/* Statistik singkat */}
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <View style={styles.tileHead}>
              <Text style={styles.tileLabel}>Era tuntas</Text>
              <Ionicons name="flag-outline" size={18} color={colors.success} />
            </View>
            <Text style={styles.tileValue}>
              {summary.completedEras}
              <Text style={styles.tileUnit}> / {summary.totalEras} era</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {eras.map((e) => (
                <View key={e.id} style={[styles.seg, { backgroundColor: e.status === 'completed' ? colors.success : colors.sand }]} />
              ))}
            </View>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileHead}>
              <Text style={styles.tileLabel}>Rata-rata kuis</Text>
              <Ionicons name="checkmark" size={18} color={colors.navy} />
            </View>
            <Text style={styles.tileValue}>{summary.averageScore ?? '–'}</Text>
            <Text style={styles.tileNote}>{summary.averageScore == null ? 'Belum ada kuis' : 'dari nilai terbaik tiap bab'}</Text>
          </View>
        </View>

        {/* Perjalanan era */}
        <SectionTitle
          right={
            <Pressable onPress={() => router.navigate('/explore')} hitSlop={10}>
              <Text style={styles.link}>Lihat semua</Text>
            </Pressable>
          }
        >
          Perjalanan era
        </SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: space.xl }} style={{ marginHorizontal: -space.xl, paddingLeft: space.xl }}>
          {eras.map((e) => {
            const s = ERA_CHIP[e.status] || ERA_CHIP.locked;
            const pct = e.chapterCount ? Math.round((e.completedChapters / e.chapterCount) * 100) : 0;
            return (
              <Pressable key={e.id} onPress={() => router.push(`/era/${e.id}`)} style={[styles.eraChip, { backgroundColor: s.bg }]}>
                <Text style={[styles.eraChipLabel, { color: s.labelColor }]}>
                  {s.label}
                  {e.status === 'unlocked' ? ` · ${pct}%` : ''}
                </Text>
                <Text style={[styles.eraChipTitle, { color: s.title }]}>{e.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Tantangan kuis */}
        {next && !next.chapter.passed && (
          <Pressable
            onPress={() => router.push(`/quiz/${next.chapter.id}`)}
            style={({ pressed }) => [styles.challenge, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.challengeIcon}>
              <Ionicons name="flash" size={24} color={colors.gold} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.challengeKicker}>TANTANGAN BERIKUTNYA</Text>
              <Text style={styles.challengeTitle}>Kuis: {next.chapter.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, paddingTop: space.lg, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: space.xl },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { ...font.extrabold, color: colors.goldLight, fontSize: 16 },
  hello: { ...font.regular, fontSize: 13, color: colors.muted },
  name: { ...font.extrabold, fontSize: 18, color: colors.text },

  hero: { borderRadius: radius.xxl, backgroundColor: colors.navy, padding: space.xl, gap: 16, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroKicker: { ...font.semibold, fontSize: 12, color: colors.goldLight, letterSpacing: 0.7, textTransform: 'uppercase' },
  heroBig: { ...font.extrabold, fontSize: 26, color: '#FFFFFF' },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroPillText: { ...font.bold, fontSize: 14, color: '#FFFFFF' },
  heroNote: { ...font.regular, fontSize: 13, color: colors.onNavy, marginTop: -6 },

  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueIcon: { width: 72, height: 72, borderRadius: 16, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  continueMeta: { ...font.semibold, fontSize: 12, color: colors.goldInk },
  continueTitle: { ...font.bold, fontSize: 16, color: colors.text },
  pct: { ...font.semibold, fontSize: 12, color: colors.muted },

  tiles: { flexDirection: 'row', gap: 12, marginTop: space.md },
  tile: { flex: 1, padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 },
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileLabel: { ...font.bold, fontSize: 13, color: colors.text },
  tileValue: { ...font.extrabold, fontSize: 24, color: colors.text },
  tileUnit: { ...font.semibold, fontSize: 15, color: colors.muted },
  tileNote: { ...font.semibold, fontSize: 12, color: colors.successInk },
  seg: { flex: 1, height: 6, borderRadius: 999 },

  link: { ...font.bold, fontSize: 13, color: colors.navy },
  eraChip: { width: 130, padding: 12, borderRadius: 16, gap: 6 },
  eraChipLabel: { ...font.bold, fontSize: 11 },
  eraChipTitle: { ...font.bold, fontSize: 14 },

  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.goldSoft,
    marginTop: space.xl,
  },
  challengeIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  challengeKicker: { ...font.bold, fontSize: 12, color: colors.goldInkDark },
  challengeTitle: { ...font.bold, fontSize: 15, color: colors.text },
});
