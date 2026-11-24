import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FLOW_STEPS } from '../lib/learningFlow';
import { Button } from '../components/ui';
import { colors, font, radius, space } from '../lib/theme';

/** Penjelasan alur belajar yang selalu bisa dibuka (ikon ⓘ di Jelajah, menu Profil). */
export default function HowItWorksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: space.xl, paddingBottom: 110 + insets.bottom, gap: 12 }}>
        <Text style={styles.kicker}>Panduan</Text>
        <Text style={styles.title}>Cara kerja belajar</Text>
        <Text style={styles.sub}>Belajar sejarah Indonesia sesuai kecepatanmu: runut dari awal, atau langsung lompat ke bagian yang belum kamu pahami.</Text>
        {FLOW_STEPS.map((s) => (
          <View key={s.title} style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name={s.icon} size={22} color={colors.navy} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardText}>{s.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        <Button title="Mengerti" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { ...font.bold, fontSize: 12, color: colors.goldInk, letterSpacing: 0.7, textTransform: 'uppercase' },
  title: { ...font.extrabold, fontSize: 28, color: colors.text, letterSpacing: -0.3 },
  sub: { ...font.regular, fontSize: 15, lineHeight: 23, color: colors.muted, marginBottom: 4 },
  card: { flexDirection: 'row', gap: 14, padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { ...font.extrabold, fontSize: 15, color: colors.text },
  cardText: { ...font.regular, fontSize: 14, lineHeight: 21, color: colors.body },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: 14, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
});
