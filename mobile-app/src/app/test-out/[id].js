import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api, errorMessage } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Button, ErrorView, Loading } from '../../components/ui';
import { QuestionFlow } from '../../components/QuestionFlow';
import { LETTERS, Option } from '../../components/QuizOption';
import { colors, font, radius, space } from '../../lib/theme';

/**
 * Tes lompat (test-out) satu era: kuis gabungan dari semua bab era itu.
 * Skor minimal 80 -> era terbuka dan semua babnya dilewati (tanpa lencana).
 */
export default function TestOutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: quiz, error, loading, reload } = useFetch(() => Api.testOutQuiz(id), [id]);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (loading) return <Loading text="Menyiapkan soal tes lompat..." />;
  if (error && !quiz) {
    if (error.code === 'ERA_ALREADY_DONE') {
      return (
        <View style={styles.center}>
          <Text style={styles.title}>Era ini sudah selesai</Text>
          <Text style={styles.sub}>Tidak perlu tes lompat untuk era yang sudah tuntas.</Text>
          <Button title="Kembali" onPress={leave} style={{ alignSelf: 'stretch' }} />
        </View>
      );
    }
    return <ErrorView error={error} onRetry={reload} />;
  }

  async function submit(answers) {
    setSubmitting(true);
    try {
      setResult(await Api.submitTestOut(id, answers));
    } catch (e) {
      Alert.alert('Gagal mengirim', errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function retry() {
    await reload(); // ambil soal baru (acak) dari server dulu, baru tutup hasil lama
    setResult(null);
  }

  if (!result) {
    return (
      <QuestionFlow
        // key mengikuti daftar soal agar jawaban lama dibuang saat soal diacak ulang
        key={quiz.questions.map((q) => q.id).join('-')}
        title={`Tes lompat · ${quiz.eraTitle}`}
        hint={`Skor minimal ${quiz.masteryScore} untuk membuka era ini dan melewati semua babnya.`}
        questions={quiz.questions}
        submitting={submitting}
        onSubmit={submit}
        onExit={leave}
      />
    );
  }

  const passed = result.passed;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 16, paddingBottom: 130 + insets.bottom, gap: 14 }}>
        <View style={[styles.resultCard, { backgroundColor: passed ? colors.successSoft : colors.dangerSoft }]}>
          <View style={[styles.resultIcon, { backgroundColor: passed ? colors.success : colors.danger }]}>
            <Ionicons name={passed ? 'lock-open' : 'refresh'} size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.score, { color: passed ? colors.successInk : colors.dangerInk }]}>{result.score}</Text>
          <Text style={styles.resultTitle}>{passed ? `${result.eraTitle} terbuka!` : 'Belum cukup untuk melompat'}</Text>
          <Text style={styles.resultSub}>
            {result.correctCount}/{result.totalQuestions} benar · skor minimal {result.masteryScore}
            {passed ? ` · ${result.skippedChapters} bab dilewati` : ''}
          </Text>
        </View>
        {passed && (
          <Text style={styles.note}>
            Bab yang dilewati dihitung selesai untuk membuka era berikutnya, tetapi tidak memberi lencana. Kamu tetap boleh mempelajarinya kapan saja.
          </Text>
        )}

        <Text style={styles.h2}>Pembahasan</Text>
        {result.results.map((r, i) => (
          <View key={r.questionId} style={styles.reviewCard}>
            <Text style={styles.qMeta}>Soal {i + 1}</Text>
            <Text style={styles.reviewQ}>{r.question}</Text>
            <View style={{ gap: 8 }}>
              {r.options.map((opt, oi) => {
                let tone = 'idle';
                if (oi === r.correctIndex) tone = 'correct';
                else if (r.selectedIndex === oi) tone = 'wrong';
                return <Option key={oi} letter={LETTERS[oi]} label={opt} tone={tone} disabled />;
              })}
            </View>
            {r.explanation ? <Text style={styles.explain}>{r.explanation}</Text> : null}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {passed ? (
          <Button title="Buka era" iconRight="arrow-forward" onPress={() => router.replace(`/era/${result.eraId}`)} style={{ flex: 1 }} />
        ) : (
          <>
            <Button title="Kembali" variant="outline" onPress={leave} style={{ flex: 1 }} />
            <Button title="Coba lagi" icon="refresh" onPress={retry} style={{ flex: 1 }} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md },
  title: { ...font.extrabold, fontSize: 20, color: colors.text, textAlign: 'center' },
  sub: { ...font.regular, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center', marginBottom: space.md },
  resultCard: { alignItems: 'center', padding: space.xl, borderRadius: radius.xxl, gap: 4 },
  resultIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  score: { ...font.extrabold, fontSize: 56, lineHeight: 64 },
  resultTitle: { ...font.extrabold, fontSize: 19, color: colors.text, textAlign: 'center' },
  resultSub: { ...font.medium, fontSize: 13, color: colors.muted, textAlign: 'center' },
  note: { ...font.regular, fontSize: 13, lineHeight: 20, color: colors.muted },
  h2: { ...font.extrabold, fontSize: 17, color: colors.text, marginTop: 8 },
  reviewCard: { padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 },
  qMeta: { ...font.bold, fontSize: 13, color: colors.goldInk },
  reviewQ: { ...font.bold, fontSize: 16, lineHeight: 23, color: colors.text },
  explain: { ...font.regular, fontSize: 14, lineHeight: 21, color: colors.body, backgroundColor: colors.bg, borderRadius: radius.md, padding: space.md },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: space.xl, paddingTop: 16, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
});
