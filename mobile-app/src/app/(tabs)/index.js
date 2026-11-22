import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useFetch } from '../../lib/useFetch';
import { Card, ErrorView, Loading, ProgressBar, StatusBadge } from '../../components/ui';
import { colors, space } from '../../lib/theme';

export default function ErasScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { data, error, loading, refreshing, refresh, reload } = useFetch(() => Api.eras());

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;

  return (
    <FlatList
      data={data.data}
      keyExtractor={(e) => String(e.id)}
      contentContainerStyle={{ padding: space.lg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ marginBottom: space.lg }}>
          <Text style={styles.hello}>Halo, {user?.name?.split(' ')[0] || 'Pelajar'} 👋</Text>
          <Text style={styles.sub}>Selesaikan setiap era untuk membuka era berikutnya.</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const locked = item.status === 'locked';
        return (
          <Card onPress={() => router.push(`/era/${item.id}`)} style={locked && { opacity: 0.7 }}>
            <View style={styles.top}>
              <View style={[styles.number, locked && { backgroundColor: colors.locked }]}>
                {locked ? <Ionicons name="lock-closed" size={18} color="#fff" /> : <Text style={styles.numberText}>{index + 1}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.years}>
                  {item.startYear} – {item.endYear} M
                </Text>
              </View>
              {item.badgeEarned && <Ionicons name="medal" size={28} color={colors.gold} />}
            </View>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.footer}>
              <StatusBadge status={item.status} />
              <Text style={styles.count}>
                {item.completedChapters}/{item.chapterCount} bab
                {item.averageScore != null ? ` · rata-rata ${item.averageScore}` : ''}
              </Text>
            </View>
            <ProgressBar value={item.completedChapters} total={item.chapterCount} />
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 4, fontSize: 15 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  number: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  years: { color: colors.muted, fontSize: 13, marginTop: 2 },
  desc: { color: colors.muted, marginVertical: space.md, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  count: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
