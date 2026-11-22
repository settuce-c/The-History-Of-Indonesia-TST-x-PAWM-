import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api, errorMessage } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Button, ErrorView, IconButton, Loading } from '../../components/ui';
import { VideoPlayer } from '../../components/VideoPlayer';
import { colors, font, initials, radius, space } from '../../lib/theme';

const AVATAR_TONES = [
  { bg: colors.goldSoft, fg: colors.goldInkDark },
  { bg: colors.navySoft, fg: colors.navy },
  { bg: colors.navy, fg: colors.goldLight },
  { bg: colors.successSoft, fg: colors.successInk },
];

function yearLabel(item) {
  return item.yearEnd ? `${item.year}–${item.yearEnd}` : `${item.year}`;
}

function Step({ done, label }) {
  return (
    <View style={styles.step}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={done ? colors.success : colors.muted2} />
      <Text style={[styles.stepText, done && { color: colors.successInk }]}>{label}</Text>
    </View>
  );
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: ch, error, loading, refreshing, refresh, reload } = useFetch(() => Api.chapter(id), [id]);
  const [marking, setMarking] = useState(false);

  if (loading) return <Loading />;
  if (error && !ch) return <ErrorView error={error} onRetry={reload} />;

  async function markWatched() {
    setMarking(true);
    try {
      const res = await Api.markWatched(id);
      if (res.eraUnlocked) Alert.alert('Era baru terbuka!', `Kamu sekarang bisa mempelajari era "${res.eraUnlocked.title}".`);
      if (res.badgeEarned) Alert.alert('Lencana baru!', `${res.badgeEarned.name} (rata-rata ${res.badgeEarned.averageScore})`);
      await refresh();
    } catch (e) {
      Alert.alert('Gagal', errorMessage(e));
    } finally {
      setMarking(false);
    }
  }

  const paragraphs = String(ch.summary || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <StatusBar style="dark" />

      {/* Bilah atas */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topRow}>
          <IconButton icon="close" label="Tutup materi" onPress={() => router.back()} />
          <Text style={styles.topTitle} numberOfLines={1}>
            Bab {ch.order} · {ch.era.title}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.segments}>
          <View style={[styles.segment, ch.watched && { backgroundColor: colors.navy }]} />
          <View style={[styles.segment, ch.passed && { backgroundColor: colors.navy }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.xl, paddingBottom: 120 + insets.bottom, gap: 18 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />}
      >
        <VideoPlayer url={ch.videoUrl} />

        <View style={{ gap: 6 }}>
          <Text style={styles.kicker}>
            {ch.era.title} · Bab {ch.order}
          </Text>
          <Text style={styles.title}>{ch.title}</Text>
          <View style={styles.steps}>
            <Step done={ch.watched} label="Video ditonton" />
            <Step done={ch.passed} label={ch.passed ? `Kuis lulus (${ch.bestScore})` : 'Kuis lulus'} />
          </View>
        </View>

        {!ch.watched && (
          <Button title="Tandai video sudah ditonton" icon="eye-outline" variant="outline" loading={marking} onPress={markWatched} />
        )}

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <View style={styles.tip}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb-outline" size={18} color={colors.goldLight} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.tipTitle}>Cara menyelesaikan bab</Text>
            <Text style={styles.tipText}>
              Tonton videonya, lalu kerjakan kuis {ch.quiz.questionCount} soal. Bab selesai jika nilaimu minimal{' '}
              {ch.quiz.passingScore}.{' '}
              {ch.attempts > 0 ? `Sudah dicoba ${ch.attempts}x, nilai terbaik ${ch.bestScore}.` : 'Kamu boleh mencoba berkali-kali.'}
            </Text>
          </View>
        </View>

        {ch.figures.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={styles.h2}>Tokoh kunci</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {ch.figures.map((f, i) => {
                const tone = AVATAR_TONES[i % AVATAR_TONES.length];
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => Alert.alert(f.name, `${yearLabel(f)} · ${f.location}, ${f.region}\n\n${f.description}`)}
                    style={styles.figure}
                    accessibilityRole="button"
                  >
                    <View style={[styles.figureAvatar, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.figureInitials, { color: tone.fg }]}>{initials(f.name)}</Text>
                    </View>
                    <Text style={styles.figureName} numberOfLines={2}>
                      {f.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {ch.events.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.h2}>Peristiwa penting</Text>
            {ch.events.map((e) => (
              <View key={e.id} style={styles.event}>
                <View style={styles.yearPill}>
                  <Text style={styles.yearText}>{yearLabel(e)}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.eventName}>{e.name}</Text>
                  <Text style={styles.eventLoc}>
                    {e.location}, {e.region}
                  </Text>
                  <Text style={styles.eventDesc}>{e.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {ch.nextChapter && (
          <Pressable onPress={() => router.replace(`/chapter/${ch.nextChapter.id}`)} style={styles.next}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextKicker}>BAB BERIKUTNYA</Text>
              <Text style={styles.nextTitle}>{ch.nextChapter.title}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.navy} />
          </Pressable>
        )}
      </ScrollView>

      {/* Bilah bawah */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 14 }]}>
        <Button title="Kembali" variant="outline" onPress={() => router.back()} style={{ paddingHorizontal: 18 }} />
        <Button
          title={ch.passed ? 'Kerjakan kuis lagi' : 'Cek pemahaman'}
          iconRight="arrow-forward"
          onPress={() => router.push(`/quiz/${ch.id}`)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.xl, paddingBottom: 12, backgroundColor: colors.card, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topTitle: { ...font.bold, flex: 1, textAlign: 'center', fontSize: 13, color: colors.muted },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 5, borderRadius: 999, backgroundColor: colors.border },

  kicker: { ...font.bold, fontSize: 12, color: colors.goldInk, letterSpacing: 0.7, textTransform: 'uppercase' },
  title: { ...font.extrabold, fontSize: 28, color: colors.text, letterSpacing: -0.3 },
  steps: { flexDirection: 'row', gap: 16, marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepText: { ...font.semibold, fontSize: 13, color: colors.muted },
  paragraph: { ...font.regular, fontSize: 16, lineHeight: 27, color: colors.body },

  tip: { flexDirection: 'row', gap: 12, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.navySoft },
  tipIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { ...font.extrabold, fontSize: 13, color: colors.navy },
  tipText: { ...font.regular, fontSize: 14, lineHeight: 21, color: colors.body },

  h2: { ...font.extrabold, fontSize: 17, color: colors.text },
  figure: { width: 76, alignItems: 'center', gap: 6 },
  figureAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  figureInitials: { ...font.extrabold, fontSize: 16 },
  figureName: { ...font.semibold, fontSize: 11, lineHeight: 14, textAlign: 'center', color: colors.text },

  event: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  yearPill: { backgroundColor: colors.navy, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, alignSelf: 'flex-start' },
  yearText: { ...font.extrabold, color: '#FFFFFF', fontSize: 12 },
  eventName: { ...font.bold, fontSize: 15, color: colors.text },
  eventLoc: { ...font.medium, fontSize: 12, color: colors.muted },
  eventDesc: { ...font.regular, fontSize: 13, lineHeight: 20, color: colors.body, marginTop: 2 },

  next: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  nextKicker: { ...font.bold, fontSize: 11, color: colors.muted, letterSpacing: 0.5 },
  nextTitle: { ...font.bold, fontSize: 15, color: colors.navy, marginTop: 2 },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: space.xl,
    paddingTop: 14,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
