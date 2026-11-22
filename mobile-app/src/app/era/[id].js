import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Button, ErrorView, IconButton, Loading, ProgressBar } from '../../components/ui';
import { Kawung } from '../../components/Ornament';
import { colors, font, radius, space } from '../../lib/theme';

function HeroPill({ icon, children }) {
  return (
    <View style={styles.heroPill}>
      <Ionicons name={icon} size={14} color={colors.goldLight} />
      <Text style={styles.heroPillText}>{children}</Text>
    </View>
  );
}

export default function EraScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, refreshing, refresh, reload } = useFetch(() => Api.eraChapters(id), [id]);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;

  const { era } = data;
  const chapters = data.data;
  const locked = era.status === 'locked';
  const current = chapters.find((c) => c.status !== 'completed' && c.status !== 'locked');

  function open(c) {
    if (c.status === 'locked') {
      Alert.alert('Bab terkunci', 'Selesaikan semua bab di era sebelumnya terlebih dahulu.');
      return;
    }
    router.push(`/chapter/${c.id}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: current ? 120 + insets.bottom : 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />}
      >
        {/* Header navy */}
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <Kawung size={240} strokeWidth={1.2} opacity={0.16} style={{ right: -60, bottom: -70 }} />
          <IconButton dark icon="chevron-back" label="Kembali" onPress={() => router.back()} />
          <Text style={styles.kicker}>
            Era {era.order ?? ''} · {era.startYear} – {era.endYear} M
          </Text>
          <Text style={styles.title}>{era.title}</Text>
          <Text style={styles.desc}>{era.description}</Text>
          <View style={styles.pills}>
            <HeroPill icon="book-outline">{era.chapterCount} bab</HeroPill>
            <HeroPill icon="checkmark-done">
              {era.completedChapters}/{era.chapterCount} selesai
            </HeroPill>
            {era.averageScore != null && <HeroPill icon="stats-chart">Rata-rata {era.averageScore}</HeroPill>}
            {era.badgeEarned && <HeroPill icon="medal">Lencana diraih</HeroPill>}
          </View>
          <ProgressBar value={era.completedChapters} total={era.chapterCount} height={6} track="rgba(255,255,255,0.18)" />
        </View>

        <View style={{ padding: space.xl, gap: 10 }}>
          {locked && (
            <View style={styles.lockNote}>
              <Ionicons name="lock-closed" size={18} color={colors.goldInkDark} />
              <Text style={styles.lockText}>Selesaikan semua bab di era sebelumnya untuk membuka era ini.</Text>
            </View>
          )}

          <View style={styles.listHead}>
            <Text style={styles.h2}>Daftar bab</Text>
            <Text style={styles.listCount}>
              {era.completedChapters} dari {era.chapterCount} selesai
            </Text>
          </View>

          {chapters.map((c, i) => {
            const isCurrent = current && c.id === current.id;
            const done = c.status === 'completed';
            const isLocked = c.status === 'locked';
            let sub = `Bab ${i + 1}`;
            if (done) sub += ` · nilai terbaik ${c.bestScore}`;
            else if (isCurrent) sub = c.status === 'in_progress' ? `Sedang dipelajari · ${(c.watched ? 50 : 0) + (c.passed ? 50 : 0)}%` : 'Siap dipelajari';
            else if (isLocked) sub += ' · terkunci';
            return (
              <Pressable
                key={c.id}
                onPress={() => open(c)}
                style={({ pressed }) => [
                  styles.chapter,
                  isCurrent && styles.chapterCurrent,
                  isLocked && { backgroundColor: colors.sand, borderColor: colors.sand },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.num,
                    { backgroundColor: done ? colors.success : isCurrent ? colors.gold : isLocked ? colors.card : colors.sand },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : isLocked ? (
                    <Ionicons name="lock-closed" size={16} color={colors.muted} />
                  ) : (
                    <Text style={[styles.numText, { color: isCurrent ? colors.text : colors.muted }]}>{i + 1}</Text>
                  )}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.chTitle}>{c.title}</Text>
                  <Text style={[styles.chSub, isCurrent && { color: colors.goldInk, ...font.semibold }]}>{sub}</Text>
                </View>
                {!isLocked && <Ionicons name="chevron-forward" size={20} color={isCurrent ? colors.navy : colors.muted} />}
              </Pressable>
            );
          })}

          <View style={[styles.chapter, { backgroundColor: colors.sand, borderColor: colors.sand }]}>
            <View style={[styles.num, { backgroundColor: era.badgeEarned ? colors.gold : colors.card }]}>
              <Ionicons name="medal" size={18} color={era.badgeEarned ? colors.text : colors.muted} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.chTitle}>Lencana {era.title}</Text>
              <Text style={styles.chSub}>
                {era.badgeEarned ? 'Sudah kamu raih!' : 'Tuntaskan semua bab dengan rata-rata nilai ≥ 90'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {current && (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
          <Button
            title={current.status === 'in_progress' ? `Lanjutkan Bab ${chapters.indexOf(current) + 1}` : `Mulai Bab ${chapters.indexOf(current) + 1}`}
            onPress={() => router.push(`/chapter/${current.id}`)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: space.xl,
    paddingBottom: space.xl + 4,
    gap: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  kicker: { ...font.bold, fontSize: 12, color: colors.goldLight, letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 6 },
  title: { ...font.extrabold, fontSize: 32, color: '#FFFFFF', letterSpacing: -0.5, marginTop: -6 },
  desc: { ...font.regular, fontSize: 14, lineHeight: 22, color: colors.onNavy },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroPillText: { ...font.semibold, fontSize: 12, color: '#FFFFFF' },

  lockNote: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.goldSoft, padding: 14, borderRadius: radius.lg },
  lockText: { ...font.semibold, flex: 1, fontSize: 13, color: colors.goldInkDark, lineHeight: 19 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  h2: { ...font.extrabold, fontSize: 17, color: colors.text },
  listCount: { ...font.semibold, fontSize: 13, color: colors.muted },

  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chapterCurrent: { borderWidth: 2, borderColor: colors.navy, padding: 13 },
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  numText: { ...font.extrabold, fontSize: 14 },
  chTitle: { ...font.bold, fontSize: 15, color: colors.text },
  chSub: { ...font.regular, fontSize: 12, color: colors.muted, lineHeight: 17 },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
