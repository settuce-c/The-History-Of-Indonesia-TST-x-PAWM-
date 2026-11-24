import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Api, API_URL, errorMessage } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useFetch } from '../../lib/useFetch';
import { Button, Field, SectionTitle } from '../../components/ui';
import { Kawung } from '../../components/Ornament';
import { Avatar } from '../../components/Avatar';
import { AVATARS } from '../../lib/avatars';
import { colors, font, radius, space } from '../../lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, signOut } = useSession();
  const { data: progress } = useFetch(() => Api.progress());
  const { data: placement } = useFetch(() => Api.myPlacement());
  const [name, setName] = useState(user?.name || '');
  const [avatarId, setAvatarId] = useState(user?.avatarId || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) Api.me().then(setUser).catch(() => {});
  }, [user, setUser]);
  useEffect(() => {
    setName(user?.name || '');
    setAvatarId(user?.avatarId || null);
  }, [user]);

  async function save() {
    setSaving(true);
    try {
      const updated = await Api.updateMe({ name: name.trim(), avatarId });
      setUser(updated);
      Alert.alert('Tersimpan', 'Profil berhasil diperbarui.');
    } catch (e) {
      Alert.alert('Gagal menyimpan', errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function confirmSignOut() {
    Alert.alert('Keluar dari akun?', 'Progresmu tetap tersimpan di server.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ]);
  }

  const changed = name !== (user?.name || '') || avatarId !== (user?.avatarId || null);

  function retakePlacement() {
    if (!placement?.taken) return router.push('/placement');
    Alert.alert(
      'Ulangi tes awal?',
      'Hasil tes awal sebelumnya akan diganti. Bab yang dulu dilewati lewat tes awal dihitung ulang sesuai hasil baru; progres kuis bab tidak hilang.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ulangi', onPress: () => router.push('/placement?retake=1') },
      ]
    );
  }
  const s = progress?.summary;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Kawung size={200} opacity={0.16} style={{ right: -50, top: -50 }} />
            <Avatar user={user} avatarId={avatarId} size={88} style={styles.avatar} />
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.role}>
              <Text style={styles.roleText}>{user?.role === 'admin' ? 'Admin' : 'Pengguna'}</Text>
            </View>

            {s && (
              <View style={styles.stats}>
                <Stat value={s.completedChapters} label="Bab selesai" />
                <View style={styles.divider} />
                <Stat value={s.averageScore ?? '–'} label="Rata-rata" />
                <View style={styles.divider} />
                <Stat value={s.badgeCount} label="Lencana" />
              </View>
            )}
          </View>

          <SectionTitle>Ubah profil</SectionTitle>
          <View style={styles.card}>
            <Field label="Nama" value={name} onChangeText={setName} />
            <Text style={styles.pickLabel}>Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((a) => {
                const on = avatarId === a.id;
                return (
                  <Pressable
                    key={a.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Avatar ${a.label}`}
                    accessibilityState={{ selected: on }}
                    onPress={() => setAvatarId(on ? null : a.id)}
                    style={[styles.avatarOption, on && styles.avatarOptionOn]}
                  >
                    <View style={[styles.avatarDot, { backgroundColor: a.bg }]}>
                      <MaterialCommunityIcons name={a.icon} size={26} color={a.fg} />
                    </View>
                    <Text style={[styles.avatarName, on && { color: colors.navy }]} numberOfLines={1}>
                      {a.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.pickHint}>Ketuk avatar yang dipilih sekali lagi untuk kembali memakai inisial.</Text>
            <Button title="Simpan perubahan" onPress={save} loading={saving} disabled={!changed || name.trim().length < 2} />
          </View>

          <SectionTitle>Belajar</SectionTitle>
          <View style={[styles.card, { gap: 4, paddingVertical: space.sm }]}>
            <MenuRow
              icon="flash-outline"
              title={placement?.taken ? 'Ulangi tes awal' : 'Ikuti tes awal'}
              sub={placement?.taken ? 'Hitung ulang era yang sudah kamu kuasai' : 'Lewati era yang sudah kamu kuasai'}
              onPress={retakePlacement}
            />
            {placement?.taken && (
              <MenuRow icon="ribbon-outline" title="Lihat hasil tes awal" sub="Era yang dikuasai dan era mulai" onPress={() => router.push('/placement-result')} />
            )}
            <MenuRow icon="information-circle-outline" title="Cara kerja belajar" sub="Alur era, kuis, tes awal, dan tes lompat" onPress={() => router.push('/how-it-works')} />
          </View>

          <SectionTitle>Tentang aplikasi</SectionTitle>
          <View style={[styles.card, { gap: 12 }]}>
            <Row icon="school-outline" title="The History of Indonesia" sub="II3160 TST × II3140 PAWM" />
            <Row icon="server-outline" title="Server API" sub={API_URL} />
          </View>

          <Button title="Keluar" icon="log-out-outline" variant="danger" onPress={confirmSignOut} style={{ marginTop: space.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, title, sub, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.6 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function Row({ icon, title, sub }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, paddingTop: space.lg, paddingBottom: 40 },
  hero: { alignItems: 'center', padding: space.xl, borderRadius: radius.xxl, backgroundColor: colors.navy, overflow: 'hidden' },
  avatar: { borderWidth: 3, borderColor: colors.gold, marginBottom: space.md },
  pickLabel: { ...font.bold, fontSize: 13, color: colors.muted, marginBottom: 8 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.sm },
  avatarOption: { width: '23%', alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent' },
  avatarOptionOn: { borderColor: colors.navy, backgroundColor: colors.navySoft },
  avatarDot: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarName: { ...font.semibold, fontSize: 10, color: colors.muted },
  pickHint: { ...font.regular, fontSize: 12, color: colors.muted, marginBottom: space.lg },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  name: { ...font.extrabold, fontSize: 22, color: '#FFFFFF' },
  email: { ...font.regular, fontSize: 14, color: colors.onNavy, marginTop: 2 },
  role: { marginTop: space.sm, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  roleText: { ...font.bold, fontSize: 12, color: colors.goldLight },
  stats: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: space.xl },
  statValue: { ...font.extrabold, fontSize: 20, color: '#FFFFFF' },
  statLabel: { ...font.medium, fontSize: 11, color: colors.onNavy },
  divider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.18)' },

  card: { padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.navySoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { ...font.bold, fontSize: 14, color: colors.text },
  rowSub: { ...font.regular, fontSize: 12, color: colors.muted },
});
