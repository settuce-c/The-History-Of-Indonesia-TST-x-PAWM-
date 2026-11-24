import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius, space, statusStyle } from '../lib/theme';
import { errorMessage } from '../lib/api';

const variants = {
  primary: { bg: colors.navy, fg: '#FFFFFF', border: colors.navy },
  gold: { bg: colors.gold, fg: colors.text, border: colors.gold },
  success: { bg: colors.success, fg: '#FFFFFF', border: colors.success },
  outline: { bg: colors.card, fg: colors.text, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.navy, border: 'transparent' },
  danger: { bg: colors.dangerSoft, fg: colors.dangerInk, border: colors.dangerSoft },
  disabled: { bg: colors.border, fg: colors.muted2, border: colors.border },
};

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon, iconRight, style, textStyle }) {
  const isDisabled = disabled || loading;
  const v = disabled && variant !== 'ghost' ? variants.disabled : variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={v.fg} style={{ marginRight: 8 }} />}
          <Text style={[styles.buttonText, { color: v.fg }, textStyle]}>{title}</Text>
          {iconRight && <Ionicons name={iconRight} size={18} color={v.fg} style={{ marginLeft: 8 }} />}
        </View>
      )}
    </Pressable>
  );
}

/** Tombol ikon kotak 44×44 (kembali, tutup, dll). */
export function IconButton({ icon, onPress, label, dark, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        dark ? { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'transparent' } : null,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Ionicons name={icon} size={22} color={dark ? '#FFFFFF' : colors.text} />
    </Pressable>
  );
}

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

export function Field({ label, error, dark, ...props }) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={[styles.label, dark && { color: colors.onNavy }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted2}
        style={[styles.input, error && { borderColor: colors.danger }]}
        {...props}
      />
    </View>
  );
}

export function Pill({ children, color = colors.muted, bg = colors.sand, icon, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {icon && <Ionicons name={icon} size={13} color={color} />}
      <Text style={[styles.pillText, { color }]}>{children}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const s = statusStyle[status] || statusStyle.available;
  return (
    <Pill color={s.color} bg={s.bg}>
      {s.label}
    </Pill>
  );
}

export function ProgressBar({ value, total, height = 8, color = colors.gold, track = colors.sand, style }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <View style={[styles.track, { height, backgroundColor: track }, style]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export function ScreenTitle({ title, subtitle }) {
  return (
    <View style={{ gap: 4, marginBottom: space.lg }}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSub}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children, right, style }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Loading({ text = 'Memuat...' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.navy} />
      <Text style={[styles.muted, { marginTop: space.sm }]}>{text}</Text>
    </View>
  );
}

export function ErrorView({ error, onRetry }) {
  const locked = error?.code === 'ERA_LOCKED';
  return (
    <View style={styles.center}>
      <View style={[styles.errorIcon, { backgroundColor: locked ? colors.sand : colors.dangerSoft }]}>
        <Ionicons name={locked ? 'lock-closed' : 'cloud-offline'} size={30} color={locked ? colors.muted : colors.danger} />
      </View>
      <Text style={styles.errorTitle}>{locked ? 'Masih terkunci' : 'Gagal memuat'}</Text>
      <Text style={[styles.muted, { textAlign: 'center' }]}>{errorMessage(error)}</Text>
      {onRetry && !locked && (
        <Button title="Coba lagi" icon="refresh" variant="outline" onPress={onRetry} style={{ marginTop: space.lg, alignSelf: 'stretch' }} />
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  button: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { ...font.bold, fontSize: 16 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { ...font.bold, fontSize: 13, color: colors.muted, marginBottom: 6 },
  input: {
    ...font.medium,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    height: 52,
    fontSize: 16,
    color: colors.text,
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { ...font.bold, fontSize: 11 },
  track: { borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  screenTitle: { ...font.extrabold, fontSize: 26, color: colors.text, letterSpacing: -0.3 },
  screenSub: { ...font.regular, fontSize: 14, color: colors.muted, lineHeight: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.md },
  sectionTitle: { ...font.extrabold, fontSize: 17, color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, backgroundColor: colors.bg },
  muted: { ...font.regular, color: colors.muted, fontSize: 14, lineHeight: 20 },
  errorIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { ...font.extrabold, fontSize: 18, color: colors.text, marginTop: space.md, marginBottom: space.xs },
});
