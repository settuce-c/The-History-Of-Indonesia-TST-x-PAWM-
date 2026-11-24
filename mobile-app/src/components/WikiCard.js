import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius, space } from '../lib/theme';

/**
 * Bagian "Baca lebih lanjut (Wikipedia)". Wajib menampilkan atribusi sumber (lisensi CC BY-SA 4.0)
 * dan tautan ke artikel aslinya. Tidak menampilkan apa pun bila ringkasan tidak tersedia.
 */
export function WikiCard({ wiki, style }) {
  if (!wiki?.extract) return null;
  return (
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <Ionicons name="globe-outline" size={18} color={colors.navy} />
        <Text style={styles.heading}>Baca lebih lanjut (Wikipedia)</Text>
      </View>
      <Text style={styles.title}>{wiki.title}</Text>
      {wiki.description ? <Text style={styles.desc}>{wiki.description}</Text> : null}
      <Text style={styles.extract}>{wiki.extract}</Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => Linking.openURL(wiki.url).catch(() => {})}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.linkText}>Baca artikel lengkap di Wikipedia</Text>
        <Ionicons name="open-outline" size={16} color={colors.navy} />
      </Pressable>
      <Text style={styles.attribution}>
        Sumber: {wiki.source?.name || 'Wikipedia'}, lisensi {wiki.source?.license || 'CC BY-SA 4.0'}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { ...font.extrabold, fontSize: 13, color: colors.navy },
  title: { ...font.extrabold, fontSize: 17, color: colors.text, marginTop: 4 },
  desc: { ...font.medium, fontSize: 12, color: colors.muted },
  extract: { ...font.regular, fontSize: 14, lineHeight: 22, color: colors.body },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, alignSelf: 'flex-start' },
  linkText: { ...font.bold, fontSize: 13, color: colors.navy, textDecorationLine: 'underline' },
  attribution: { ...font.regular, fontSize: 11, color: colors.muted, marginTop: 2 },
});
