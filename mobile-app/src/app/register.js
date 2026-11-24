import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSession } from '../lib/session';
import { errorMessage } from '../lib/api';
import { Button, Field, IconButton } from '../components/ui';
import { KawungPattern } from '../components/Ornament';
import { colors, font, space } from '../lib/theme';

export default function RegisterScreen() {
  const { register } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KawungPattern width={width} height={300} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.xxl, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <IconButton dark icon="chevron-back" label="Kembali ke halaman masuk" onPress={() => router.back()} />

          <Text style={styles.kicker}>Akun baru</Text>
          <Text style={styles.title}>Mulai perjalananmu menelusuri sejarah.</Text>
          <Text style={styles.subtitle}>Buat akun untuk menyimpan progres, nilai kuis, dan lencanamu.</Text>

          <View style={{ marginTop: space.xl }}>
            <Field dark label="Nama" value={name} onChangeText={setName} placeholder="Nama lengkap" textContentType="name" />
            <Field
              dark
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <Field
              dark
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimal 8 karakter"
              secureTextEntry
              textContentType="newPassword"
              onSubmitEditing={onSubmit}
            />
            {error && <Text style={styles.error}>{errorMessage(error)}</Text>}
            <Button title="Daftar" variant="gold" onPress={onSubmit} loading={loading} disabled={!name || !email || !password} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navyDeep },
  kicker: {
    ...font.bold,
    fontSize: 12,
    color: colors.goldLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: space.xxl,
  },
  title: { ...font.extrabold, fontSize: 30, lineHeight: 35, color: '#FFFFFF', letterSpacing: -0.5, marginTop: space.sm },
  subtitle: { ...font.regular, fontSize: 15, lineHeight: 23, color: colors.onNavy, marginTop: space.md },
  error: { ...font.semibold, color: '#FFB4AB', marginBottom: space.md, lineHeight: 20 },
});
