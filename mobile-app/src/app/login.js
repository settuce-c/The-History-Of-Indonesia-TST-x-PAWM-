import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSession } from '../lib/session';
import { API_URL, errorMessage } from '../lib/api';
import { Button, Field } from '../components/ui';
import { Candi, KawungPattern } from '../components/Ornament';
import { colors, font, space } from '../lib/theme';

const CHIPS = ['3 era sejarah', 'Kuis tiap bab', 'Koleksi lencana'];

export default function LoginScreen() {
  const { signIn } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password); // navigasi otomatis lewat Stack.Protected
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KawungPattern width={width} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.art}>
            <Candi size={170} />
          </View>

          <View style={styles.chips}>
            {CHIPS.map((c) => (
              <Text key={c} style={styles.chip}>
                {c}
              </Text>
            ))}
          </View>
          <Text style={styles.title}>Jelajahi sejarah Indonesia, satu era demi satu era.</Text>
          <Text style={styles.subtitle}>
            Dari Kutai dan Sriwijaya sampai Kebangkitan Nasional — belajar lewat video, ringkasan, dan kuis.
          </Text>

          <View style={{ marginTop: space.xl }}>
            <Field
              dark
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              autoCapitalize="none"
              autoComplete="email"
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
              textContentType="password"
              onSubmitEditing={onSubmit}
            />
            {error && <Text style={styles.error}>{errorMessage(error)}</Text>}
            <Button title="Masuk" variant="gold" onPress={onSubmit} loading={loading} disabled={!email || !password} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <Pressable onPress={() => router.push('/register')} hitSlop={10} accessibilityRole="link">
              <Text style={styles.link}>Daftar</Text>
            </Pressable>
          </View>
          <Text style={styles.server}>Server: {API_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navyDeep },
  container: { paddingHorizontal: space.xxl, flexGrow: 1, justifyContent: 'flex-end' },
  art: { alignItems: 'center', marginBottom: space.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.lg },
  chip: {
    ...font.semibold,
    fontSize: 12,
    color: colors.goldLight,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  title: { ...font.extrabold, fontSize: 30, lineHeight: 35, color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { ...font.regular, fontSize: 15, lineHeight: 23, color: colors.onNavy, marginTop: space.md },
  error: { ...font.semibold, color: '#FFB4AB', marginBottom: space.md, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: space.xl },
  footerText: { ...font.regular, fontSize: 14, color: colors.onNavy },
  link: { ...font.bold, fontSize: 14, color: colors.goldLight },
  server: { ...font.regular, textAlign: 'center', fontSize: 11, color: 'rgba(211,216,236,0.6)', marginTop: space.lg },
});
