import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const TONE = {
  idle: { border: colors.border, bg: colors.card, keyBg: colors.sand, keyFg: colors.text },
  selected: { border: colors.navy, bg: colors.navySoft, keyBg: colors.navy, keyFg: '#FFFFFF' },
  correct: { border: colors.success, bg: colors.successSoft, keyBg: colors.success, keyFg: '#FFFFFF' },
  wrong: { border: colors.danger, bg: colors.dangerSoft, keyBg: colors.danger, keyFg: '#FFFFFF' },
};

/** Satu pilihan jawaban. tone: idle | selected | correct | wrong. Dipakai kuis bab, tes awal, dan tes lompat. */
export function Option({ letter, label, tone, onPress, disabled }) {
  const t = TONE[tone];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: tone === 'selected' }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.option, { borderColor: t.border, backgroundColor: t.bg }, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.key, { backgroundColor: t.keyBg }]}>
        <Text style={[styles.keyText, { color: t.keyFg }]}>{letter}</Text>
      </View>
      <Text style={styles.optionText}>{label}</Text>
      {tone === 'correct' && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
      {tone === 'wrong' && <Ionicons name="close-circle" size={22} color={colors.danger} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  key: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  keyText: { ...font.extrabold, fontSize: 14 },
  optionText: { ...font.semibold, flex: 1, fontSize: 16, lineHeight: 22, color: colors.text },
});
