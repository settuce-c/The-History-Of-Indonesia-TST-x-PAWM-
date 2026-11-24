import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, IconButton, ProgressBar } from './ui';
import { LETTERS, Option } from './QuizOption';
import { colors, font, space } from '../lib/theme';

/**
 * Alur satu-soal-per-layar yang dipakai tes awal dan tes lompat.
 * Komponen ini hanya mengumpulkan jawaban; pengiriman & penilaian dilakukan pemanggil (server).
 *  - questions: [{ id, question, options[], eraTitle? }]
 *  - onSubmit(answers): answers = [{ questionId, selectedIndex }]
 */
export function QuestionFlow({ title, hint, questions, submitting, onSubmit, onExit }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const total = questions.length;
  const q = questions[step];
  const picked = answers[q.id];
  const isLast = step === total - 1;

  function next() {
    if (isLast) {
      onSubmit(Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId: Number(questionId), selectedIndex })));
      return;
    }
    setStep((s) => s + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function close() {
    if (Object.keys(answers).length === 0) return onExit();
    Alert.alert('Keluar dari tes?', 'Jawabanmu belum dikirim dan akan hilang.', [
      { text: 'Lanjut mengerjakan', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: onExit },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 12, paddingBottom: 160 + insets.bottom, gap: 22 }}
      >
        <View style={styles.topRow}>
          <IconButton icon="close" label="Keluar dari tes" onPress={close} />
          <ProgressBar value={step + (picked !== undefined ? 1 : 0)} total={total} height={10} color={colors.success} track={colors.border} style={{ flex: 1 }} />
          <Text style={styles.counter}>
            {step + 1}/{total}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={styles.qMeta}>
            {title} · {q.eraTitle ? `${q.eraTitle} · ` : ''}soal {step + 1}
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

        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </ScrollView>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {step > 0 && (
          <Button title="Sebelumnya" variant="outline" onPress={() => setStep((s) => s - 1)} style={{ paddingHorizontal: 18 }} />
        )}
        <Button
          title={isLast ? 'Kirim jawaban' : 'Lanjut'}
          iconRight={isLast ? 'send' : 'arrow-forward'}
          onPress={next}
          // Soal yang tidak dijawab dihitung salah, tetapi tombol baru aktif setelah soal ini dijawab.
          disabled={picked === undefined}
          loading={submitting}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counter: { ...font.extrabold, fontSize: 14, color: colors.text },
  qMeta: { ...font.bold, fontSize: 13, color: colors.goldInk },
  question: { ...font.extrabold, fontSize: 22, lineHeight: 30, color: colors.text },
  hint: { ...font.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: space.xl,
    paddingTop: 18,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
