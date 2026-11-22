import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api, API_URL, errorMessage } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useFetch } from '../../lib/useFetch';
import { Button, Field, SectionTitle } from '../../components/ui';
import { Kawung } from '../../components/Ornament';
import { colors, font, initials, radius, space } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, setUser, signOut } = useSession();
  const { data: progress } = useFetch(() => Api.progress());
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) Api.me().then(setUser).catch(() => {});
  }, [user, setUser]);
  useEffect(() => {
    setName(user?.name || '');
    setAvatarUrl(user?.avatarUrl || '');
  }, [user]);

  async function save() {
    setSaving(true);
    try {
      const updated = await Api.updateMe({ name: name.trim(), avatarUrl: avatarUrl.trim() || null });
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

  const changed = name !== (user?.name || '') || avatarUrl !== (user?.avatarUrl || '');
  const s = progress?.summary;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Kawung size={200} opacity={0.16} style={{ right: -50, top: -50 }} />
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={StyleSheet.absoluteFill} />
              ) : (
                <Text style={styles.avatarText}>{initials(user?.name)}</Text>
              )}
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.role}>
              <Text style={styles.roleText}>{user?.role === 'admin' ? 'Admin' : 'Siswa'}</Text>
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
            <Field
              label="URL foto profil (https, opsional)"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://..."
              autoCapitalize="none"
              keyboardType="url"
            />
            <Button title="Simpan perubahan" onPress={save} loading={saving} disabled={!changed || name.trim().length < 2} />
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
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.goldSoft,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: space.md,
  },
  avatarText: { ...font.extrabold, color: colors.navy, fontSize: 30 },
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
