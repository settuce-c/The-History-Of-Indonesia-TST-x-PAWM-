import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../lib/theme';

const icon =
  (name) =>
  ({ color, size, focused }) => <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.locked,
        headerTitleStyle: { color: colors.primary, fontWeight: '800' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Belajar', headerTitle: 'The History of Indonesia', tabBarIcon: icon('library') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progres', tabBarIcon: icon('trophy') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
