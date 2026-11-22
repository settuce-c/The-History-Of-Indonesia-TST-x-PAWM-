import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SessionProvider, useSession } from '../lib/session';
import { colors } from '../lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  if (!fontsLoaded) return <Splash />;

  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.navyDeep, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}

/**
 * Navigasi utama. Stack.Protected memastikan layar belajar hanya bisa dibuka setelah login,
 * dan layar login/daftar hanya saat belum login. Header bawaan disembunyikan karena
 * setiap layar menggambar header-nya sendiri sesuai desain.
 */
function RootNavigator() {
  const { isLoading, token } = useSession();
  if (isLoading) return <Splash />;
  const signedIn = Boolean(token);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={signedIn} redirectTo="/login">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="era/[id]" />
        <Stack.Screen name="chapter/[id]" options={{ contentStyle: { backgroundColor: colors.card } }} />
        <Stack.Screen name="quiz/[id]" options={{ gestureEnabled: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn} redirectTo="/(tabs)">
        <Stack.Screen name="login" options={{ contentStyle: { backgroundColor: colors.navyDeep } }} />
        <Stack.Screen name="register" options={{ contentStyle: { backgroundColor: colors.navyDeep } }} />
      </Stack.Protected>
    </Stack>
  );
}
