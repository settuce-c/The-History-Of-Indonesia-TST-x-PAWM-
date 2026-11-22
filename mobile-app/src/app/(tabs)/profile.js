import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Api, API_URL, errorMessage } from '../../lib/api';
import { useSession } from '../../lib/session';
import { Button, Card, Field, SectionTitle } from '../../components/ui';
import { colors, space } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, setUser, signOut } = useSession();
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

  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const changed = name !== (user?.name || '') || avatarUrl !== (user?.avatarUrl || '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.initials]}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>{user?.role === 'admin' ? 'Admin' : 'Siswa'}</Text>
        </View>

        <SectionTitle>Ubah Profil</SectionTitle>
        <Card>
          <Field label="Nama" value={name} onChangeText={setName} />
          <Field
            label="URL Foto Profil (https, opsional)"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />
          <Button title="Simpan" icon="save" onPress={save} loading={saving} disabled={!changed || name.trim().length < 2} />
        </Card>

        <SectionTitle>Tentang</SectionTitle>
        <Card>
          <Text style={styles.about}>TheHistoryOfIndonesia · II3160 TST × II3140 PAWM</Text>
          <Text style={styles.server}>Server API: {API_URL}</Text>
        </Card>

        <Button title="Keluar" icon="log-out" variant="danger" onPress={signOut} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginVertical: space.lg },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: space.md },
  initials: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: colors.gold, fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { color: colors.muted, marginTop: 2 },
  role: { marginTop: space.sm, backgroundColor: colors.goldSoft, color: colors.primary, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  about: { color: colors.text, fontWeight: '600' },
  server: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
