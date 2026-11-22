import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, space, statusStyle } from '../lib/theme';
import { errorMessage } from '../lib/api';

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon, style }) {
  const v = variants[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={v.fg} style={{ marginRight: 6 }} />}
          <Text style={[styles.buttonText, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const variants = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
};

export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({ label, error, ...props }) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.locked} style={[styles.input, error && { borderColor: colors.danger }]} {...props} />
    </View>
  );
}

export function StatusBadge({ status }) {
  const s = statusStyle[status] || statusStyle.not_started;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={12} color={s.color} />
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export function ProgressBar({ value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

export function Loading({ text = 'Memuat...' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.muted, { marginTop: space.sm }]}>{text}</Text>
    </View>
  );
}

export function ErrorView({ error, onRetry }) {
  const locked = error?.code === 'ERA_LOCKED';
  return (
    <View style={styles.center}>
      <Ionicons name={locked ? 'lock-closed' : 'cloud-offline'} size={42} color={locked ? colors.locked : colors.danger} />
      <Text style={styles.errorTitle}>{locked ? 'Masih terkunci' : 'Gagal memuat'}</Text>
      <Text style={[styles.muted, { textAlign: 'center' }]}>{errorMessage(error)}</Text>
      {onRetry && !locked && <Button title="Coba lagi" icon="refresh" variant="outline" onPress={onRetry} style={{ marginTop: space.lg }} />}
    </View>
  );
}

export function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.md,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  track: { height: 8, backgroundColor: colors.lockedSoft, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.gold, borderRadius: 999 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.bg },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: space.md, marginBottom: space.xs },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: space.lg, marginBottom: space.sm },
});
