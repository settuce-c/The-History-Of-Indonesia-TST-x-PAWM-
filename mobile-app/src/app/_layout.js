import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider, useSession } from '../lib/session';
import { Loading } from '../components/ui';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SessionProvider>
  );
}

/**
 * Navigasi utama. Stack.Protected memastikan layar belajar hanya bisa dibuka setelah login,
 * dan layar login/daftar hanya saat belum login.
 */
function RootNavigator() {
  const { isLoading, token } = useSession();
  if (isLoading) return <Loading text="Menyiapkan aplikasi..." />;
  const signedIn = Boolean(token);

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerBackTitle: 'Kembali',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={signedIn} redirectTo="/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="era/[id]" options={{ title: 'Era' }} />
        <Stack.Screen name="chapter/[id]" options={{ title: 'Bab' }} />
        <Stack.Screen name="quiz/[id]" options={{ title: 'Kuis' }} />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn} redirectTo="/(tabs)">
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Daftar Akun' }} />
      </Stack.Protected>
    </Stack>
  );
}
