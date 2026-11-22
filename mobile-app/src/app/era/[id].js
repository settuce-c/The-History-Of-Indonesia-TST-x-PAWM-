import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Api } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { Card, ErrorView, Loading, ProgressBar, StatusBadge } from '../../components/ui';
import { colors, space, statusStyle } from '../../lib/theme';

export default function EraScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data, error, loading, refreshing, refresh, reload } = useFetch(() => Api.eraChapters(id), [id]);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorView error={error} onRetry={reload} />;

  const { era } = data;
  const locked = era.status === 'locked';

  return (
    <>
      <Stack.Screen options={{ title: era.title }} />
      <FlatList
        data={data.data}
        keyExtractor={(c) => String(c.id)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
            <Text style={styles.heroTitle}>{era.title}</Text>
            <Text style={styles.heroText}>{era.description}</Text>
            <Text style={[styles.heroText, { marginBottom: space.sm }]}>
              {era.completedChapters}/{era.chapterCount} bab selesai
              {era.badgeEarned ? ' · 🏅 Lencana diraih' : ''}
            </Text>
            <ProgressBar value={era.completedChapters} total={era.chapterCount} />
            {locked && (
              <View style={styles.lockNote}>
                <Ionicons name="lock-closed" size={16} color={colors.primary} />
                <Text style={styles.lockText}>Selesaikan semua bab di era sebelumnya untuk membuka era ini.</Text>
              </View>
            )}
          </Card>
        }
        renderItem={({ item }) => {
          const s = statusStyle[item.status];
          return (
            <Card
              onPress={() =>
                item.status === 'locked'
                  ? Alert.alert('Bab terkunci', 'Selesaikan semua bab di era sebelumnya terlebih dahulu.')
                  : router.push(`/chapter/${item.id}`)
              }
            >
              <View style={styles.row}>
                <Ionicons name={s.icon} size={26} color={s.color} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.chapterNo}>Bab {item.order}</Text>
                  <Text style={styles.chapterTitle}>{item.title}</Text>
                  <View style={styles.meta}>
                    <StatusBadge status={item.status} />
                    {item.bestScore != null && <Text style={styles.score}>Nilai terbaik {item.bestScore}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.locked} />
              </View>
            </Card>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroText: { color: colors.goldSoft, marginTop: space.xs, lineHeight: 20 },
  lockNote: { flexDirection: 'row', gap: 6, backgroundColor: colors.goldSoft, padding: space.sm, borderRadius: 8, marginTop: space.md },
  lockText: { color: colors.primary, flex: 1, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  chapterNo: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  chapterTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginVertical: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  score: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
