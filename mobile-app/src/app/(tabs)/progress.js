import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { ErrorView, Loading, Pill, ProgressBar, ScreenTitle, SectionTitle, StatusBadge } from '../../components/ui';
import { colors, font, radius, space, statusStyle } from '../../lib/theme';

function Tile({ label, value, note, icon }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileHead}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Ionicons name={icon} size={16} color={colors.navy} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      {note ? <Text style={styles.tileNote}>{note}</Text> : null}
    </View>
  );
}

export default function ProgressScreen() {
  const { data, error, loading, refreshing, refresh, reload } = useFetch(() => Api.progress());

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;

  const { summary, badges, eras } = data;
  const pct = summary.totalChapters ? Math.round((summary.completedChapters / summary.totalChapters) * 100) : 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />}
      >
        <ScreenTitle title="Progres belajarmu" subtitle="Semua yang sudah kamu pelajari, di satu tempat." />

        <View style={styles.grid}>
          <Tile label="Bab selesai" icon="book-outline" value={`${summary.completedChapters}/${summary.totalChapters}`} note={summary.skippedChapters > 0 ? `${pct}% materi · ${summary.skippedChapters} dilewati` : `${pct}% materi`} />
          <Tile label="Era tuntas" icon="flag-outline" value={`${summary.completedEras}/${summary.totalEras}`} />
          <Tile label="Rata-rata nilai" icon="stats-chart-outline" value={summary.averageScore ?? '–'} note={summary.averageScore != null ? 'nilai terbaik per bab' : 'belum ada kuis'} />
          <Tile label="Lencana" icon="medal-outline" value={summary.badgeCount} />
        </View>

        <SectionTitle>Koleksi lencana</SectionTitle>
        <View style={styles.badges}>
          {eras.map((era) => {
            const earned = badges.find((b) => b.eraId === era.id);
            return (
              <View key={era.id} style={[styles.badge, !earned && { opacity: 0.7 }]}>
                <View style={[styles.badgeIcon, { backgroundColor: earned ? colors.gold : colors.sand }]}>
                  <Ionicons name={earned ? 'medal' : 'lock-closed'} size={24} color={earned ? colors.text : colors.muted} />
                </View>
                <Text style={styles.badgeName} numberOfLines={2}>
                  {era.title}
                </Text>
                <Text style={styles.badgeSub}>{earned ? `Rata-rata ${earned.averageScore}` : 'Belum diraih'}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.hint}>Lencana diberikan saat satu era diselesaikan lewat kuis bab dengan rata-rata minimal 90. Bab yang dilewati lewat tes tidak memberi lencana.</Text>

        <SectionTitle>Nilai per bab</SectionTitle>
        <View style={{ gap: 12 }}>
          {eras.map((era) => (
            <View key={era.id} style={styles.eraCard}>
              <View style={styles.eraHead}>
                <Text style={styles.eraTitle}>{era.title}</Text>
                {era.status === 'locked' ? <Pill icon="lock-closed">Terkunci</Pill> : <StatusBadge status={era.status} />}
              </View>
              {era.chapters.map((c) => {
                const s = statusStyle[c.status] || statusStyle.available;
                return (
                  <View key={c.id} style={styles.chapterRow}>
                    <Ionicons name={s.icon} size={18} color={c.status === 'completed' ? colors.success : s.color} />
                    <Text style={styles.chapterTitle} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <View style={{ width: 54 }}>
                      {c.bestScore != null && (
                        <ProgressBar value={c.bestScore} total={100} height={5} color={c.passed ? colors.success : colors.gold} />
                      )}
                    </View>
                    <Text style={styles.chapterScore}>{c.bestScore ?? '–'}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, paddingTop: space.lg, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48.5%',
    flexGrow: 1,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileLabel: { ...font.semibold, fontSize: 12, color: colors.muted },
  tileValue: { ...font.extrabold, fontSize: 24, color: colors.text },
  tileNote: { ...font.semibold, fontSize: 12, color: colors.successInk },

  badges: { flexDirection: 'row', gap: 10 },
  badge: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badgeName: { ...font.bold, fontSize: 12, textAlign: 'center', color: colors.text, lineHeight: 16 },
  badgeSub: { ...font.medium, fontSize: 11, color: colors.muted },
  hint: { ...font.regular, fontSize: 12, color: colors.muted, marginTop: 10, lineHeight: 18 },

  eraCard: { padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  eraHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 },
  eraTitle: { ...font.extrabold, fontSize: 16, color: colors.text, flex: 1 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  chapterTitle: { ...font.medium, flex: 1, fontSize: 14, color: colors.text },
  chapterScore: { ...font.extrabold, fontSize: 14, color: colors.text, width: 30, textAlign: 'right' },
});
