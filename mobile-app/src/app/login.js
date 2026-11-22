import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSession } from '../lib/session';
import { API_URL, errorMessage } from '../lib/api';
import { Button, Field, Card } from '../components/ui';
import { colors, space } from '../lib/theme';

export default function LoginScreen() {
  const { signIn } = useSession();
  const router = useRouter();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="book" size={36} color={colors.gold} />
            </View>
            <Text style={styles.title}>The History of Indonesia</Text>
            <Text style={styles.subtitle}>Belajar sejarah Indonesia lewat video, ringkasan, dan kuis.</Text>
          </View>

          <Card>
            <Field
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
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimal 8 karakter"
              secureTextEntry
              textContentType="password"
              onSubmitEditing={onSubmit}
            />
            {error && <Text style={styles.error}>{errorMessage(error)}</Text>}
            <Button title="Masuk" icon="log-in" onPress={onSubmit} loading={loading} disabled={!email || !password} />
          </Card>

          <Button title="Belum punya akun? Daftar" variant="ghost" onPress={() => router.push('/register')} />
          <Text style={styles.server}>Server: {API_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: space.xl },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: space.xs },
  error: { color: colors.danger, marginBottom: space.md, lineHeight: 20 },
  server: { textAlign: 'center', fontSize: 11, color: colors.locked, marginTop: space.md },
});
