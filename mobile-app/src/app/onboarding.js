import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSession } from '../lib/session';
import { ONBOARDING_SLIDES } from '../lib/learningFlow';
import { Button } from '../components/ui';
import { KawungPattern } from '../components/Ornament';
import { colors, font, space } from '../lib/theme';

/**
 * Onboarding setelah daftar akun pertama kali: 3 layar penjelasan alur belajar,
 * lalu pilihan "Ikuti tes awal" atau "Mulai dari awal".
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { finishOnboarding } = useSession();
  const [page, setPage] = useState(0);
  const slide = ONBOARDING_SLIDES[page];
  const last = page === ONBOARDING_SLIDES.length - 1;

  async function choose(path) {
    await finishOnboarding(); // setelah ini layar belajar boleh dibuka
    router.replace(path);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KawungPattern width={width} height={300} />

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.brand}>The History of Indonesia</Text>
        {!last && (
          <Pressable onPress={() => setPage(ONBOARDING_SLIDES.length - 1)} hitSlop={10} accessibilityRole="button">
            <Text style={styles.skip}>Lewati</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name={slide.icon} size={44} color={colors.gold} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots} accessibilityLabel={`Layar ${page + 1} dari ${ONBOARDING_SLIDES.length}`}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>

        {last ? (
          <View style={{ gap: 10 }}>
            <Button title="Ikuti tes awal" icon="flash" variant="gold" onPress={() => choose('/placement')} />
            <Button title="Mulai dari awal" variant="outline" onPress={() => choose('/(tabs)')} />
            <Text style={styles.note}>Tes awal sekitar 6 soal. Kamu bisa mengikutinya nanti lewat menu Profil.</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {page > 0 && <Button title="Kembali" variant="outline" onPress={() => setPage((p) => p - 1)} style={{ paddingHorizontal: 18 }} />}
            <Button title="Lanjut" variant="gold" iconRight="arrow-forward" onPress={() => setPage((p) => p + 1)} style={{ flex: 1 }} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navyDeep },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xxl },
  brand: { ...font.bold, fontSize: 13, color: colors.goldLight, letterSpacing: 0.6 },
  skip: { ...font.bold, fontSize: 14, color: colors.onNavy },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xxl, gap: space.md },
  iconWrap: { width: 84, height: 84, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  title: { ...font.extrabold, fontSize: 30, lineHeight: 36, color: '#FFFFFF', letterSpacing: -0.5 },
  text: { ...font.regular, fontSize: 16, lineHeight: 25, color: colors.onNavy },
  bottom: { paddingHorizontal: space.xxl, gap: space.xl },
  dots: { flexDirection: 'row', gap: 8, alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotOn: { width: 24, backgroundColor: colors.gold },
  note: { ...font.regular, fontSize: 12, color: colors.onNavy, textAlign: 'center' },
});
