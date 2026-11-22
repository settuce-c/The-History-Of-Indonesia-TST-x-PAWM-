import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api, errorMessage } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Button, ErrorView, IconButton, Loading, ProgressBar } from '../../components/ui';
import { colors, font, radius, space } from '../../lib/theme';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const TONE = {
  idle: { border: colors.border, bg: colors.card, keyBg: colors.sand, keyFg: colors.text },
  selected: { border: colors.navy, bg: colors.navySoft, keyBg: colors.navy, keyFg: '#FFFFFF' },
  correct: { border: colors.success, bg: colors.successSoft, keyBg: colors.success, keyFg: '#FFFFFF' },
  wrong: { border: colors.danger, bg: colors.dangerSoft, keyBg: colors.danger, keyFg: '#FFFFFF' },
};

function Option({ letter, label, tone, onPress, disabled }) {
  const t = TONE[tone];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: tone === 'selected' }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.option, { borderColor: t.border, backgroundColor: t.bg }, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.key, { backgroundColor: t.keyBg }]}>
        <Text style={[styles.keyText, { color: t.keyFg }]}>{letter}</Text>
      </View>
      <Text style={styles.optionText}>{label}</Text>
      {tone === 'correct' && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
      {tone === 'wrong' && <Ionicons name="close-circle" size={22} color={colors.danger} />}
    </Pressable>
  );
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const { data: quiz, error, loading, reload } = useFetch(() => Api.quiz(id), [id]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loading />;
  if (error && !quiz) return <ErrorView error={error} onRetry={reload} />;

  const total = quiz.questions.length;
  const q = quiz.questions[step];
  const picked = q ? answers[q.id] : undefined;
  const isLast = step === total - 1;

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
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } catch (e) {
      Alert.alert('Gagal mengirim', errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (isLast) return submit();
    setStep((s) => s + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function retry() {
    setAnswers({});
    setResult(null);
    setStep(0);
  }

  function close() {
    if (result || Object.keys(answers).length === 0) return router.back();
    Alert.alert('Keluar dari kuis?', 'Jawabanmu belum dikirim dan akan hilang.', [
      { text: 'Lanjut mengerjakan', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  // ---------- Hasil ----------
  if (result) {
    const passed = result.passed;
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="dark" />
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 12, paddingBottom: 130 + insets.bottom, gap: 14 }}>
          <View style={styles.topRow}>
            <IconButton icon="close" label="Tutup" onPress={() => router.back()} />
            <Text style={styles.topTitle} numberOfLines={1}>
              Hasil kuis · {quiz.chapterTitle}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={[styles.resultCard, { backgroundColor: passed ? colors.successSoft : colors.dangerSoft }]}>
            <View style={[styles.resultIcon, { backgroundColor: passed ? colors.success : colors.danger }]}>
              <Ionicons name={passed ? 'ribbon' : 'refresh'} size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.score, { color: passed ? colors.successInk : colors.dangerInk }]}>{result.score}</Text>
            <Text style={styles.resultTitle}>{passed ? 'Selamat, kamu lulus!' : 'Belum lulus, coba lagi ya'}</Text>
            <Text style={styles.resultSub}>
              {result.correctCount}/{result.totalQuestions} benar · nilai terbaik {result.bestScore} · percobaan ke-{result.attempt}
            </Text>
          </View>

          {result.chapterCompleted && <Banner icon="book" tone="success" text="Bab ini selesai!" />}
          {passed && !result.chapterCompleted && <Banner icon="eye-outline" tone="gold" text="Tandai videonya sudah ditonton untuk menyelesaikan bab." />}
          {result.eraUnlocked && <Banner icon="lock-open" tone="navy" text={`Era baru terbuka: ${result.eraUnlocked.title}`} />}
          {result.badgeEarned && (
            <Banner icon="medal" tone="gold" text={`${result.badgeEarned.name} (rata-rata ${result.badgeEarned.averageScore})`} />
          )}

          <Text style={styles.h2}>Pembahasan</Text>
          {quiz.questions.map((qq, qi) => {
            const review = result.results.find((r) => r.questionId === qq.id);
            return (
              <View key={qq.id} style={styles.reviewCard}>
                <Text style={styles.qMeta}>Soal {qi + 1}</Text>
                <Text style={styles.reviewQ}>{qq.question}</Text>
                <View style={{ gap: 8 }}>
                  {qq.options.map((opt, oi) => {
                    let tone = 'idle';
                    if (oi === review?.correctIndex) tone = 'correct';
                    else if (answers[qq.id] === oi) tone = 'wrong';
                    return <Option key={oi} letter={LETTERS[oi]} label={opt} tone={tone} disabled />;
                  })}
                </View>
                {review?.explanation ? (
                  <View style={styles.explain}>
                    <Text style={[styles.explainTitle, { color: review.correct ? colors.successInk : colors.dangerInk }]}>
                      {review.correct ? 'Benar' : review.selectedIndex == null ? 'Tidak dijawab' : 'Belum tepat'}
                    </Text>
                    <Text style={styles.explainText}>{review.explanation}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.panel, { paddingBottom: insets.bottom + 16, flexDirection: 'row', gap: 10 }]}>
          <Button title="Kembali ke bab" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} />
          {!passed && <Button title="Ulangi" icon="refresh" onPress={retry} style={{ flex: 1 }} />}
        </View>
      </View>
    );
  }

  // ---------- Mengerjakan ----------
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 12, paddingBottom: 160 + insets.bottom, gap: 22 }}>
        <View style={styles.topRow}>
          <IconButton icon="close" label="Keluar dari kuis" onPress={close} />
          <ProgressBar value={step + (picked !== undefined ? 1 : 0)} total={total} height={10} color={colors.success} track={colors.border} style={{ flex: 1 }} />
          <Text style={styles.counter}>
            {step + 1}/{total}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={styles.qMeta}>
            Soal {step + 1} dari {total} · {quiz.chapterTitle}
          </Text>
          <Text style={styles.question}>{q.question}</Text>
        </View>

        <View style={{ gap: 10 }} accessibilityRole="radiogroup">
          {q.options.map((opt, oi) => (
            <Option
              key={oi}
              letter={LETTERS[oi]}
              label={opt}
              tone={picked === oi ? 'selected' : 'idle'}
              onPress={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
            />
          ))}
        </View>

        <Text style={styles.hint}>Nilai minimal lulus {quiz.passingScore}. Jawaban dinilai setelah semua soal dikirim.</Text>
      </ScrollView>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16, flexDirection: 'row', gap: 10 }]}>
        {step > 0 && (
          <Button title="Sebelumnya" variant="outline" onPress={() => setStep((s) => s - 1)} style={{ paddingHorizontal: 18 }} />
        )}
        <Button
          title={isLast ? 'Kirim jawaban' : 'Lanjut'}
          iconRight={isLast ? 'send' : 'arrow-forward'}
          onPress={next}
          disabled={picked === undefined}
          loading={submitting}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const BANNER = {
  success: { bg: colors.successSoft, fg: colors.successInk },
  gold: { bg: colors.goldSoft, fg: colors.goldInkDark },
  navy: { bg: colors.navySoft, fg: colors.navy },
};

function Banner({ icon, text, tone }) {
  const t = BANNER[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }]}>
      <Ionicons name={icon} size={20} color={t.fg} />
      <Text style={[styles.bannerText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topTitle: { ...font.bold, flex: 1, textAlign: 'center', fontSize: 13, color: colors.muted },
  counter: { ...font.extrabold, fontSize: 14, color: colors.text },
  qMeta: { ...font.bold, fontSize: 13, color: colors.goldInk },
  question: { ...font.extrabold, fontSize: 22, lineHeight: 30, color: colors.text },
  hint: { ...font.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  key: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  keyText: { ...font.extrabold, fontSize: 14 },
  optionText: { ...font.semibold, flex: 1, fontSize: 16, lineHeight: 22, color: colors.text },

  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.xl,
    paddingTop: 18,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  resultCard: { alignItems: 'center', padding: space.xl, borderRadius: radius.xxl, gap: 4 },
  resultIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  score: { ...font.extrabold, fontSize: 56, lineHeight: 64 },
  resultTitle: { ...font.extrabold, fontSize: 19, color: colors.text },
  resultSub: { ...font.medium, fontSize: 13, color: colors.muted, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg },
  bannerText: { ...font.bold, flex: 1, fontSize: 14, lineHeight: 20 },

  h2: { ...font.extrabold, fontSize: 17, color: colors.text, marginTop: 8 },
  reviewCard: { padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 },
  reviewQ: { ...font.bold, fontSize: 16, lineHeight: 23, color: colors.text },
  explain: { backgroundColor: colors.bg, borderRadius: radius.md, padding: space.md, gap: 4 },
  explainTitle: { ...font.extrabold, fontSize: 14 },
  explainText: { ...font.regular, fontSize: 14, lineHeight: 21, color: colors.body },
});
