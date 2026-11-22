import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Api, setAuthToken, setUnauthorizedHandler } from './api';

const TOKEN_KEY = 'thehistoryofid.token';
const SessionContext = createContext(null);

/** Menyimpan JWT di SecureStore (Keychain iOS / Keystore Android) agar login bertahan. */
export function SessionProvider({ children }) {
  const [state, setState] = useState({ isLoading: true, token: null, user: null });

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setState({ isLoading: false, token: null, user: null });
  }, []);

  const startSession = useCallback(async ({ token, user }) => {
    setAuthToken(token);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setState({ isLoading: false, token, user });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut());
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
      if (!token) return setState({ isLoading: false, token: null, user: null });
      setAuthToken(token);
      try {
        const user = await Api.me();
        setState({ isLoading: false, token, user });
      } catch (e) {
        if (e.status === 401) return signOut();
        // Server tidak terjangkau: tetap masuk, layar akan menampilkan error + tombol coba lagi.
        setState({ isLoading: false, token, user: null });
      }
    })();
  }, [signOut]);

  const value = useMemo(
    () => ({
      ...state,
      signIn: async (email, password) => startSession(await Api.login(email, password)),
      register: async (name, email, password) => startSession(await Api.register(name, email, password)),
      signOut,
      setUser: (user) => setState((s) => ({ ...s, user })),
    }),
    [state, startSession, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession harus dipakai di dalam SessionProvider');
  return ctx;
}
