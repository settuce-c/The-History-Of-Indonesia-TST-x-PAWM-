import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Api, errorMessage } from '../lib/api';
import { useFetch } from '../lib/useFetch';
import { Button, ErrorView, Loading } from '../components/ui';
import { QuestionFlow } from '../components/QuestionFlow';
import { colors, font, space } from '../lib/theme';

/**
 * Tes awal (placement test). Soal diambil dari server (±2 per era, tanpa kunci jawaban);
 * penilaian dilakukan di server. Parameter ?retake=1 dipakai dari Profil > "Ulangi tes awal".
 */
export default function PlacementScreen() {
  const router = useRouter();
  const { retake } = useLocalSearchParams();
  const isRetake = retake === '1';
  const { data, error, loading, reload } = useFetch(() => Api.placement(isRetake), [isRetake]);
  const [submitting, setSubmitting] = useState(false);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (loading) return <Loading text="Menyiapkan soal tes awal..." />;
  if (error && !data) {
    if (error.code === 'PLACEMENT_ALREADY_TAKEN') {
      return (
        <View style={styles.center}>
          <Text style={styles.title}>Tes awal sudah pernah dikerjakan</Text>
          <Text style={styles.sub}>Tes awal hanya bisa sekali. Untuk mengulang, pilih "Ulangi tes awal" di menu Profil.</Text>
          <Button title="Lihat hasil tes awal" onPress={() => router.replace('/placement-result')} style={{ alignSelf: 'stretch' }} />
          <Button title="Kembali" variant="outline" onPress={leave} style={{ alignSelf: 'stretch' }} />
        </View>
      );
    }
    return <ErrorView error={error} onRetry={reload} />;
  }

  async function submit(answers) {
    setSubmitting(true);
    try {
      await Api.submitPlacement(answers, isRetake);
      router.replace('/placement-result');
    } catch (e) {
      Alert.alert('Gagal mengirim', errorMessage(e));
      setSubmitting(false);
    }
  }

  return (
    <QuestionFlow
      title="Tes awal"
      hint={`Era dengan skor minimal ${data.masteryScore} dianggap sudah kamu kuasai dan babnya dilewati. Tidak yakin? Pilih jawaban terbaikmu.`}
      questions={data.questions}
      submitting={submitting}
      onSubmit={submit}
      onExit={leave}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md },
  title: { ...font.extrabold, fontSize: 20, color: colors.text, textAlign: 'center' },
  sub: { ...font.regular, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center', marginBottom: space.md },
});
