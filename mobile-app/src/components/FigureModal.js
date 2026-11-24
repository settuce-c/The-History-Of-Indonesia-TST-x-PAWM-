import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Api } from '../lib/api';
import { Button } from './ui';
import { WikiCard } from './WikiCard';
import { colors, font, initials, radius, space } from '../lib/theme';

const yearLabel = (item) => (item.yearEnd ? `${item.year}–${item.yearEnd}` : `${item.year}`);

/**
 * Jendela detail tokoh. Info dasar langsung tampil dari data bab; ringkasan Wikipedia diambil
 * dari server (yang sudah menyimpannya di cache) dan hanya muncul bila tersedia.
 */
export function FigureModal({ figure, onClose }) {
  const insets = useSafeAreaInsets();
  const [wiki, setWiki] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setWiki(null);
    if (!figure) return undefined;
    let cancelled = false;
    setLoading(true);
    Api.item(figure.id)
      .then((res) => !cancelled && setWiki(res.wikiSummary))
      .catch(() => {}) // Wikipedia/jaringan gagal: cukup tanpa bagian Wikipedia
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [figure]);

  return (
    <Modal visible={Boolean(figure)} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Tutup" />
      {figure && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <ScrollView contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
            <View style={styles.headRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(figure.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{figure.name}</Text>
                <Text style={styles.meta}>
                  {yearLabel(figure)} · {figure.location}, {figure.region}
                </Text>
              </View>
            </View>
            <Text style={styles.desc}>{figure.description}</Text>
            {loading && <ActivityIndicator color={colors.navy} />}
            <WikiCard wiki={wiki} />
          </ScrollView>
          <Button title="Tutup" variant="outline" onPress={onClose} style={{ marginTop: space.md }} />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,24,40,0.45)' },
  sheet: {
    maxHeight: '82%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: space.xl,
    paddingTop: 10,
  },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: space.md },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...font.extrabold, fontSize: 18, color: colors.navy },
  name: { ...font.extrabold, fontSize: 20, color: colors.text },
  meta: { ...font.medium, fontSize: 12, color: colors.muted, marginTop: 2 },
  desc: { ...font.regular, fontSize: 15, lineHeight: 24, color: colors.body, borderRadius: radius.md },
});
