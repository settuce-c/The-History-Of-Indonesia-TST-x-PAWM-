import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font } from '../../lib/theme';

const icon =
  (name) =>
  ({ color, focused }) => <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted2,
        tabBarLabelStyle: { ...font.bold, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 6 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="explore" options={{ title: 'Jelajah', tabBarIcon: icon('compass') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progres', tabBarIcon: icon('stats-chart') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
