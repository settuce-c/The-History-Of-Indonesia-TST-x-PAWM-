import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useSession } from '../lib/session';
import { errorMessage } from '../lib/api';
import { Button, Card, Field } from '../components/ui';
import { colors, space } from '../lib/theme';

export default function RegisterScreen() {
  const { register } = useSession();
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>Buat akun siswa untuk mulai belajar dan menyimpan progresmu.</Text>
        <Card>
          <Field label="Nama" value={name} onChangeText={setName} placeholder="Nama lengkap" textContentType="name" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimal 8 karakter"
            secureTextEntry
            textContentType="newPassword"
          />
          {error && <Text style={styles.error}>{errorMessage(error)}</Text>}
          <Button title="Daftar" icon="person-add" onPress={onSubmit} loading={loading} disabled={!name || !email || !password} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 15, marginBottom: space.lg, lineHeight: 21 },
  error: { color: colors.danger, marginBottom: space.md, lineHeight: 20 },
});
