import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Card, ErrorView, Loading, ProgressBar, SectionTitle, StatusBadge } from '../../components/ui';
import { colors, space, statusStyle } from '../../lib/theme';

function Stat({ value, label, icon }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={colors.gold} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const { data, error, loading, refreshing, refresh, reload } = useFetch(() => Api.progress());

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;

  const { summary, badges, eras } = data;
  return (
    <ScrollView
      contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
        <Text style={styles.heroTitle}>Perjalanan Belajarmu</Text>
        <View style={styles.stats}>
          <Stat value={`${summary.completedChapters}/${summary.totalChapters}`} label="Bab selesai" icon="book" />
          <Stat value={`${summary.completedEras}/${summary.totalEras}`} label="Era tuntas" icon="flag" />
          <Stat value={summary.averageScore ?? '–'} label="Rata-rata" icon="stats-chart" />
          <Stat value={summary.badgeCount} label="Lencana" icon="medal" />
        </View>
        <ProgressBar value={summary.completedChapters} total={summary.totalChapters} />
      </Card>

      <SectionTitle>Lencana</SectionTitle>
      {badges.length === 0 ? (
        <Card>
          <Text style={styles.muted}>Belum ada lencana. Tuntaskan satu era dengan rata-rata nilai ≥ 90 untuk mendapatkannya.</Text>
        </Card>
      ) : (
        badges.map((b) => (
          <Card key={b.eraId} style={styles.badgeCard}>
            <Ionicons name="medal" size={32} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.badgeName}>{b.name}</Text>
              <Text style={styles.muted}>Rata-rata {b.averageScore}</Text>
            </View>
          </Card>
        ))
      )}

      <SectionTitle>Per Era</SectionTitle>
      {eras.map((era) => (
        <Card key={era.id}>
          <View style={styles.eraHead}>
            <Text style={styles.eraTitle}>{era.title}</Text>
            <StatusBadge status={era.status} />
          </View>
          {era.chapters.map((c) => {
            const s = statusStyle[c.status];
            return (
              <View key={c.id} style={styles.chapterRow}>
                <Ionicons name={s.icon} size={18} color={s.color} />
                <Text style={styles.chapterTitle}>{c.title}</Text>
                <Text style={styles.chapterScore}>{c.bestScore ?? '–'}</Text>
              </View>
            );
          })}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: space.lg },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { color: colors.goldSoft, fontSize: 11 },
  muted: { color: colors.muted, lineHeight: 20 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderColor: colors.gold },
  badgeName: { fontWeight: '800', color: colors.text, fontSize: 16 },
  eraHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  eraTitle: { fontWeight: '800', fontSize: 16, color: colors.text, flex: 1 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  chapterTitle: { flex: 1, color: colors.text },
  chapterScore: { fontWeight: '700', color: colors.muted, width: 32, textAlign: 'right' },
});
