import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api, errorMessage } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Button, Card, ErrorView, Loading, SectionTitle, StatusBadge } from '../../components/ui';
import { VideoPlayer } from '../../components/VideoPlayer';
import { colors, space } from '../../lib/theme';

function yearLabel(item) {
  return item.yearEnd ? `${item.year}–${item.yearEnd}` : `${item.year}`;
}

function ItemRow({ item }) {
  return (
    <View style={styles.item}>
      <View style={styles.yearPill}>
        <Text style={styles.yearText}>{yearLabel(item)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemLoc}>
          <Ionicons name="location" size={12} color={colors.muted} /> {item.location}, {item.region}
        </Text>
        <Text style={styles.itemDesc}>{item.description}</Text>
      </View>
    </View>
  );
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: ch, error, loading, refreshing, refresh, reload } = useFetch(() => Api.chapter(id), [id]);
  const [marking, setMarking] = useState(false);

  if (loading) return <Loading />;
  if (error && !ch) return <ErrorView error={error} onRetry={reload} />;

  async function markWatched() {
    setMarking(true);
    try {
      const res = await Api.markWatched(id);
      if (res.eraUnlocked) Alert.alert('🎉 Era baru terbuka!', `Kamu sekarang bisa mempelajari era "${res.eraUnlocked.title}".`);
      if (res.badgeEarned) Alert.alert('🏅 Lencana baru!', `${res.badgeEarned.name} (rata-rata ${res.badgeEarned.averageScore})`);
      await refresh();
    } catch (e) {
      Alert.alert('Gagal', errorMessage(e));
    } finally {
      setMarking(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: ch.title }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.lg, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <VideoPlayer url={ch.videoUrl} />

        <Text style={styles.era}>{ch.era.title}</Text>
        <Text style={styles.title}>{ch.title}</Text>
        <View style={styles.statusRow}>
          <StatusBadge status={ch.status} />
          <Text style={styles.check}>
            {ch.watched ? '✅' : '⬜'} Video {'  '}
            {ch.passed ? '✅' : '⬜'} Kuis lulus
          </Text>
        </View>

        <Button
          title={ch.watched ? 'Video sudah ditonton' : 'Tandai sudah ditonton'}
          icon={ch.watched ? 'checkmark-done' : 'eye'}
          variant={ch.watched ? 'outline' : 'primary'}
          disabled={ch.watched}
          loading={marking}
          onPress={markWatched}
          style={{ marginTop: space.md }}
        />

        <SectionTitle>Ringkasan</SectionTitle>
        <Card>
          <Text style={styles.summary}>{ch.summary}</Text>
        </Card>

        <SectionTitle>Kuis</SectionTitle>
        <Card style={{ borderColor: colors.gold, backgroundColor: colors.goldSoft }}>
          <Text style={styles.quizInfo}>
            {ch.quiz.questionCount} soal pilihan ganda · lulus jika nilai ≥ {ch.quiz.passingScore}
          </Text>
          <Text style={styles.quizSub}>
            {ch.attempts > 0 ? `Sudah dicoba ${ch.attempts}x · nilai terbaik ${ch.bestScore}` : 'Belum pernah dicoba'}
          </Text>
          <Button
            title={ch.passed ? 'Kerjakan lagi' : 'Mulai Kuis'}
            icon="create"
            onPress={() => router.push(`/quiz/${ch.id}`)}
            style={{ marginTop: space.md }}
          />
        </Card>

        {ch.events.length > 0 && <SectionTitle>Peristiwa Penting</SectionTitle>}
        {ch.events.map((e) => (
          <ItemRow key={e.id} item={e} />
        ))}

        {ch.figures.length > 0 && <SectionTitle>Tokoh</SectionTitle>}
        {ch.figures.map((f) => (
          <ItemRow key={f.id} item={f} />
        ))}

        {ch.nextChapter && (
          <Button
            title={`Bab berikutnya: ${ch.nextChapter.title}`}
            variant="outline"
            icon="arrow-forward"
            onPress={() => router.push(`/chapter/${ch.nextChapter.id}`)}
            style={{ marginTop: space.xl }}
          />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  era: { color: colors.primary, fontWeight: '700', marginTop: space.lg, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
  check: { color: colors.muted, fontSize: 13 },
  summary: { fontSize: 16, lineHeight: 25, color: colors.text },
  quizInfo: { fontSize: 15, fontWeight: '700', color: colors.text },
  quizSub: { color: colors.muted, marginTop: 4 },
  item: { flexDirection: 'row', gap: space.md, backgroundColor: colors.card, borderRadius: 14, padding: space.md, marginBottom: space.sm, borderWidth: 1, borderColor: colors.border },
  yearPill: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  yearText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  itemName: { fontWeight: '700', fontSize: 15, color: colors.text },
  itemLoc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  itemDesc: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
