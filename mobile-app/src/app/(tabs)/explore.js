import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Button, ErrorView, IconButton, Loading, Pill, ProgressBar, ScreenTitle } from '../../components/ui';
import { colors, font, radius, space } from '../../lib/theme';

const FILTERS = [
  ['all', 'Semua'],
  ['done', 'Selesai'],
  ['todo', 'Belum'],
];

function years(e) {
  return `${e.startYear} – ${e.endYear} M`;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const { data, error, loading, refreshing, refresh, reload } = useFetch(() => Api.eras());

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;

  const all = data.data.map((e, i) => ({ ...e, num: i + 1 }));
  const shown = all.filter((e) => (filter === 'done' ? e.status === 'completed' : filter === 'todo' ? e.status !== 'completed' : true));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <ScreenTitle title="Jelajah Era" subtitle="Ikuti garis waktu sejarah Indonesia. Selesaikan atau lewati semua bab di satu era untuk membuka era berikutnya." />
          </View>
          <IconButton icon="information-circle-outline" label="Cara kerja belajar" onPress={() => router.push('/how-it-works')} />
        </View>

        <View style={styles.segment} accessibilityRole="tablist">
          {FILTERS.map(([key, label]) => {
            const on = filter === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setFilter(key)}
                style={[styles.segBtn, on && styles.segBtnOn]}
              >
                <Text style={[styles.segText, on && { color: colors.navy }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {shown.length === 0 && <Text style={styles.empty}>Belum ada era di kategori ini.</Text>}

        {shown.map((e, i) => {
          const done = e.status === 'completed';
          const active = e.status === 'unlocked';
          const last = i === shown.length - 1;
          return (
            <View key={e.id} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: done ? colors.success : active ? colors.gold : colors.sand },
                    active && styles.dotRing,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.dotText, { color: active ? colors.text : colors.muted2 }]}>{e.num}</Text>
                  )}
                </View>
                <View style={[styles.line, { backgroundColor: done ? colors.success : colors.line, opacity: last ? 0 : 1 }]} />
              </View>

              <View style={{ flex: 1, paddingBottom: space.lg }}>
                {active ? (
                  <Pressable onPress={() => router.push(`/era/${e.id}`)} style={({ pressed }) => [styles.activeCard, pressed && { opacity: 0.92 }]}>
                    <Text style={styles.activeYears}>{years(e)}</Text>
                    <Text style={styles.activeTitle}>{e.title}</Text>
                    <Text style={styles.activeDesc} numberOfLines={3}>
                      {e.description}
                    </Text>
                    <View style={styles.row}>
                      <ProgressBar value={e.completedChapters} total={e.chapterCount} height={6} track="rgba(255,255,255,0.18)" style={{ flex: 1 }} />
                      <Text style={styles.activeCount}>
                        {e.completedChapters}/{e.chapterCount} bab
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => router.push(`/era/${e.id}`)}
                    style={({ pressed }) => [styles.card, !done && { backgroundColor: colors.sand, borderColor: colors.sand }, pressed && { opacity: 0.8 }]}
                  >
                    <View style={[styles.row, { justifyContent: 'space-between' }]}>
                      <Text style={styles.years}>{years(e)}</Text>
                      {done ? (
                        <Pill color={colors.successInk} bg={colors.successSoft} icon={e.badgeEarned ? 'medal' : undefined}>
                          {e.badgeEarned ? 'Lencana' : 'Selesai'}
                        </Pill>
                      ) : (
                        <Pill icon="lock-closed">Terkunci</Pill>
                      )}
                    </View>
                    <Text style={styles.title}>{e.title}</Text>
                    <Text style={styles.desc} numberOfLines={2}>
                      {e.description}
                    </Text>
                    {done && e.averageScore != null && <Text style={styles.score}>Rata-rata nilai {e.averageScore}</Text>}
                    {done && e.skippedChapters > 0 && <Text style={styles.skipped}>{e.skippedChapters} bab dilewati lewat tes</Text>}
                    {e.status === 'locked' && (
                      <View style={{ gap: 10, marginTop: 4 }}>
                        <Text style={styles.lockReason}>
                          {e.lock?.message || 'Selesaikan semua bab di era sebelumnya untuk membuka era ini.'}
                        </Text>
                        {e.lock?.testOutAvailable && (
                          <Button
                            title="Tes lompat ke era ini"
                            icon="play-skip-forward"
                            variant="gold"
                            onPress={() => router.push(`/test-out/${e.id}`)}
                            style={{ minHeight: 46 }}
                          />
                        )}
                      </View>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, paddingTop: space.lg, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  segment: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.md, backgroundColor: colors.sand, marginBottom: space.xl },
  segBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segText: { ...font.bold, fontSize: 13, color: colors.muted },
  empty: { ...font.regular, color: colors.muted, textAlign: 'center', marginTop: space.xl },

  rail: { width: 36, alignItems: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dotRing: { borderWidth: 5, borderColor: colors.goldSoft, width: 46, height: 46, borderRadius: 23, marginHorizontal: -5 },
  dotText: { ...font.extrabold, fontSize: 14 },
  line: { flex: 1, width: 2, marginVertical: 4 },

  activeCard: { padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.navy, gap: 8 },
  activeYears: { ...font.bold, fontSize: 12, color: colors.goldLight },
  activeTitle: { ...font.extrabold, fontSize: 18, color: '#FFFFFF' },
  activeDesc: { ...font.regular, fontSize: 13, lineHeight: 20, color: colors.onNavy },
  activeCount: { ...font.bold, fontSize: 12, color: '#FFFFFF' },

  card: { padding: 14, paddingHorizontal: space.lg, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 6 },
  years: { ...font.bold, fontSize: 12, color: colors.goldInk },
  title: { ...font.extrabold, fontSize: 16, color: colors.text },
  desc: { ...font.regular, fontSize: 13, lineHeight: 20, color: colors.muted },
  score: { ...font.semibold, fontSize: 12, color: colors.successInk },
  skipped: { ...font.semibold, fontSize: 12, color: colors.navy },
  lockReason: { ...font.medium, fontSize: 12, lineHeight: 18, color: colors.goldInkDark },
});
