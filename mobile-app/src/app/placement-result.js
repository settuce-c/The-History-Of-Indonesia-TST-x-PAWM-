import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api } from '../lib/api';
import { useFetch } from '../lib/useFetch';
import { Button, ErrorView, Loading, Pill } from '../components/ui';
import { colors, font, radius, space } from '../lib/theme';

/** Hasil tes awal: era yang dikuasai (dilewati) dan era tempat pengguna mulai belajar. */
export default function PlacementResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useFetch(() => Api.myPlacement());

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;
  if (!data.taken) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Kamu belum mengikuti tes awal</Text>
        <Button title="Ikuti tes awal" onPress={() => router.replace('/placement')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const mastered = data.masteredEras;
  const start = data.startEra;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 16, paddingBottom: 130 + insets.bottom, gap: 14 }}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={start ? 'flag' : 'trophy'} size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroKicker}>Hasil tes awal</Text>
          <Text style={styles.heroTitle}>{start ? `Kamu mulai dari ${start.title}` : 'Semua era sudah kamu kuasai!'}</Text>
          <Text style={styles.heroSub}>
            {mastered.length === 0
              ? 'Belum ada era yang dilewati. Tenang, kamu akan belajar dari awal dengan runut.'
              : `${mastered.length} era dikuasai dan babnya dilewati. Bab yang dilewati dihitung selesai, tetapi tidak memberi lencana.`}
          </Text>
        </View>

        <Text style={styles.h2}>Skor per era</Text>
        {data.eras.map((e) => (
          <View key={e.eraId} style={styles.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.eraTitle}>{e.title}</Text>
              <Text style={styles.eraSub}>
                {e.total > 0 ? `${e.correct} dari ${e.total} soal benar` : 'Belum ada soal untuk era ini'}
              </Text>
            </View>
            {e.score != null && <Text style={styles.score}>{e.score}</Text>}
            {e.mastered ? (
              <Pill color={colors.successInk} bg={colors.successSoft} icon="play-skip-forward">
                Dikuasai
              </Pill>
            ) : (
              <Pill color={colors.goldInkDark} bg={colors.goldSoft}>
                Dipelajari
              </Pill>
            )}
          </View>
        ))}
        <Text style={styles.note}>Batas dikuasai: skor minimal {data.masteryScore}. Kamu tetap boleh membuka bab yang dilewati kapan saja.</Text>
      </ScrollView>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={start ? `Mulai belajar: ${start.title}` : 'Ke beranda'}
          iconRight="arrow-forward"
          onPress={() => (start ? router.replace(`/era/${start.id}`) : router.replace('/(tabs)'))}
        />
        {start && <Button title="Ke beranda" variant="ghost" onPress={() => router.replace('/(tabs)')} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.lg },
  title: { ...font.extrabold, fontSize: 20, color: colors.text, textAlign: 'center' },
  hero: { alignItems: 'center', padding: space.xl, borderRadius: radius.xxl, backgroundColor: colors.navy, gap: 6 },
  heroIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroKicker: { ...font.bold, fontSize: 12, color: colors.goldLight, letterSpacing: 0.7, textTransform: 'uppercase' },
  heroTitle: { ...font.extrabold, fontSize: 24, lineHeight: 30, color: '#FFFFFF', textAlign: 'center' },
  heroSub: { ...font.regular, fontSize: 14, lineHeight: 21, color: colors.onNavy, textAlign: 'center' },
  h2: { ...font.extrabold, fontSize: 17, color: colors.text, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  eraTitle: { ...font.bold, fontSize: 15, color: colors.text },
  eraSub: { ...font.regular, fontSize: 12, color: colors.muted },
  score: { ...font.extrabold, fontSize: 20, color: colors.text },
  note: { ...font.regular, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center', marginTop: 4 },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: 14, gap: 4, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
});
