import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api, errorMessage } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Button, Card, ErrorView, Loading } from '../../components/ui';
import { colors, radius, space } from '../../lib/theme';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollRef = useRef(null);
  const { data: quiz, error, loading, reload } = useFetch(() => Api.quiz(id), [id]);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loading />;
  if (error && !quiz) return <ErrorView error={error} onRetry={reload} />;

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.totalQuestions;

  async function submit() {
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId: Number(questionId),
        selectedIndex,
      }));
      // Penilaian dilakukan di server; kunci jawaban baru diterima di respons ini.
      const res = await Api.submitQuiz(id, payload);
      setResult(res);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      Alert.alert('Gagal mengirim', errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setAnswers({});
    setResult(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <>
      <Stack.Screen options={{ title: `Kuis: ${quiz.chapterTitle}` }} />
      <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: space.lg, paddingBottom: 48 }}>
        {result ? (
          <ResultHeader result={result} onRetry={retry} onBack={() => router.back()} />
        ) : (
          <Text style={styles.intro}>
            Jawab {quiz.totalQuestions} soal. Nilai minimal lulus {quiz.passingScore}. Kamu boleh mencoba berkali-kali.
          </Text>
        )}

        {quiz.questions.map((q, qi) => {
          const review = result?.results.find((r) => r.questionId === q.id);
          return (
            <Card key={q.id}>
              <Text style={styles.qNo}>Soal {qi + 1}</Text>
              <Text style={styles.question}>{q.question}</Text>
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                let tone = selected ? 'selected' : 'idle';
                if (review) {
                  if (oi === review.correctIndex) tone = 'correct';
                  else if (selected) tone = 'wrong';
                  else tone = 'idle';
                }
                return (
                  <Pressable
                    key={oi}
                    disabled={Boolean(result)}
                    onPress={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    style={[styles.option, optionTone[tone]]}
                  >
                    <View style={[styles.letter, tone !== 'idle' && { backgroundColor: optionTone[tone].borderColor }]}>
                      <Text style={[styles.letterText, tone !== 'idle' && { color: '#fff' }]}>{LETTERS[oi]}</Text>
                    </View>
                    <Text style={styles.optionText}>{opt}</Text>
                    {tone === 'correct' && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                    {tone === 'wrong' && <Ionicons name="close-circle" size={20} color={colors.danger} />}
                  </Pressable>
                );
              })}
              {review && (
                <View style={styles.explain}>
                  <Text style={styles.explainTitle}>{review.correct ? '✅ Benar' : review.selectedIndex == null ? '⚠️ Tidak dijawab' : '❌ Salah'}</Text>
                  <Text style={styles.explainText}>{review.explanation}</Text>
                </View>
              )}
            </Card>
          );
        })}

        {!result && (
          <Button
            title={allAnswered ? 'Kirim Jawaban' : `Jawab semua soal (${answeredCount}/${quiz.totalQuestions})`}
            icon="send"
            onPress={submit}
            disabled={!allAnswered}
            loading={submitting}
          />
        )}
        {result && <Button title="Coba lagi" icon="refresh" variant="outline" onPress={retry} />}
      </ScrollView>
    </>
  );
}

function ResultHeader({ result, onRetry, onBack }) {
  const passed = result.passed;
  return (
    <Card style={{ backgroundColor: passed ? colors.successSoft : colors.dangerSoft, borderColor: passed ? colors.success : colors.danger, alignItems: 'center' }}>
      <Ionicons name={passed ? 'ribbon' : 'refresh-circle'} size={48} color={passed ? colors.success : colors.danger} />
      <Text style={[styles.score, { color: passed ? colors.success : colors.danger }]}>{result.score}</Text>
      <Text style={styles.resultTitle}>{passed ? 'Selamat, kamu lulus!' : 'Belum lulus, coba lagi ya'}</Text>
      <Text style={styles.resultSub}>
        {result.correctCount}/{result.totalQuestions} benar · nilai terbaik {result.bestScore} · percobaan ke-{result.attempt}
      </Text>
      {result.chapterCompleted && <Text style={styles.banner}>📘 Bab ini selesai!</Text>}
      {passed && !result.chapterCompleted && <Text style={styles.banner}>Tandai videonya sudah ditonton untuk menyelesaikan bab.</Text>}
      {result.eraUnlocked && <Text style={styles.banner}>🎉 Era baru terbuka: {result.eraUnlocked.title}</Text>}
      {result.badgeEarned && (
        <Text style={styles.banner}>
          🏅 {result.badgeEarned.name} (rata-rata {result.badgeEarned.averageScore})
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
        <Button title="Kembali ke bab" variant="outline" onPress={onBack} />
        {!passed && <Button title="Ulangi" onPress={onRetry} />}
      </View>
    </Card>
  );
}

const optionTone = {
  idle: { borderColor: colors.border, backgroundColor: '#fff' },
  selected: { borderColor: colors.primary, backgroundColor: colors.goldSoft },
  correct: { borderColor: colors.success, backgroundColor: colors.successSoft },
  wrong: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
};

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 15, marginBottom: space.lg, lineHeight: 21 },
  qNo: { color: colors.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  question: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 4, marginBottom: space.md, lineHeight: 24 },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1.5, borderRadius: radius.md, padding: space.md, marginBottom: space.sm },
  letter: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.lockedSoft, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontWeight: '800', color: colors.muted },
  optionText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  explain: { backgroundColor: colors.bg, borderRadius: radius.md, padding: space.md, marginTop: space.xs },
  explainTitle: { fontWeight: '800', marginBottom: 4, color: colors.text },
  explainText: { color: colors.text, lineHeight: 20 },
  score: { fontSize: 56, fontWeight: '900', marginTop: space.xs },
  resultTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  resultSub: { color: colors.muted, marginTop: 4, textAlign: 'center' },
  banner: { marginTop: space.sm, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
