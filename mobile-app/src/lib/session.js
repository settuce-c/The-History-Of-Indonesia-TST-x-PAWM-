import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Api, setAuthToken, setUnauthorizedHandler } from './api';

const TOKEN_KEY = 'thehistoryofid.token';
// Penanda "baru daftar, belum selesai onboarding". Disimpan agar onboarding dilanjutkan bila aplikasi ditutup di tengah jalan.
const ONBOARDING_KEY = 'thehistoryofid.onboarding';
const SessionContext = createContext(null);

/** Menyimpan JWT di SecureStore (Keychain iOS / Keystore Android) agar login bertahan. */
export function SessionProvider({ children }) {
  const [state, setState] = useState({ isLoading: true, token: null, user: null, onboarding: false });

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(ONBOARDING_KEY).catch(() => {});
    setState({ isLoading: false, token: null, user: null, onboarding: false });
  }, []);

  const startSession = useCallback(async ({ token, user }, { onboarding = false } = {}) => {
    setAuthToken(token);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (onboarding) await SecureStore.setItemAsync(ONBOARDING_KEY, 'pending').catch(() => {});
    else await SecureStore.deleteItemAsync(ONBOARDING_KEY).catch(() => {});
    setState({ isLoading: false, token, user, onboarding });
  }, []);

  /** Dipanggil saat pengguna memilih "Ikuti tes awal" atau "Mulai dari awal" di onboarding. */
  const finishOnboarding = useCallback(async () => {
    await SecureStore.deleteItemAsync(ONBOARDING_KEY).catch(() => {});
    setState((s) => ({ ...s, onboarding: false }));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut());
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
      if (!token) return setState({ isLoading: false, token: null, user: null });
      setAuthToken(token);
      const onboarding = (await SecureStore.getItemAsync(ONBOARDING_KEY).catch(() => null)) === 'pending';
      try {
        const user = await Api.me();
        setState({ isLoading: false, token, user, onboarding });
      } catch (e) {
        if (e.status === 401) return signOut();
        // Server tidak terjangkau: tetap masuk, layar akan menampilkan error + tombol coba lagi.
        setState({ isLoading: false, token, user: null, onboarding });
      }
    })();
  }, [signOut]);

  const value = useMemo(
    () => ({
      ...state,
      signIn: async (email, password) => startSession(await Api.login(email, password)),
      // Akun baru -> onboarding dulu (penjelasan alur + pilihan tes awal).
      register: async (name, email, password) =>
        startSession(await Api.register(name, email, password), { onboarding: true }),
      finishOnboarding,
      signOut,
      setUser: (user) => setState((s) => ({ ...s, user })),
    }),
    [state, startSession, finishOnboarding, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession harus dipakai di dalam SessionProvider');
  return ctx;
}
