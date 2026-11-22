import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Memuat data setiap kali layar tampil (fokus), sehingga status era/bab selalu terbaru
 * setelah kembali dari kuis. Mengembalikan { data, error, loading, refreshing, reload, refresh }.
 */
export function useFetch(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async (mode) => {
    if (mode === 'refresh') setRefreshing(true);
    else if (mode === 'initial') setLoading(true);
    try {
      setData(await loaderRef.current());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      run('focus');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, ...deps])
  );

  return {
    data,
    error,
    loading: loading && !data,
    refreshing,
    reload: () => run('initial'),
    refresh: () => run('refresh'),
  };
}
