import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Mask, Pattern, Rect, Path, Stop } from 'react-native-svg';
import { colors } from '../lib/theme';

/** Satu motif kawung (empat kelopak) — dekorasi sudut kartu. */
export function Kawung({ size = 140, color = colors.gold, opacity = 0.18, strokeWidth = 1.5, style }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" style={[{ position: 'absolute', opacity }, style]} pointerEvents="none">
      <G fill="none" stroke={color} strokeWidth={strokeWidth}>
        <Ellipse cx="30" cy="12" rx="9" ry="14" />
        <Ellipse cx="30" cy="48" rx="9" ry="14" />
        <Ellipse cx="12" cy="30" rx="14" ry="9" />
        <Ellipse cx="48" cy="30" rx="14" ry="9" />
      </G>
    </Svg>
  );
}

/** Pola kawung berulang yang memudar ke bawah — latar layar sambutan. */
export function KawungPattern({ width, height = 420, opacity = 0.16 }) {
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, opacity }} pointerEvents="none">
      <Defs>
        <Pattern id="kawung" width="60" height="60" patternUnits="userSpaceOnUse">
          <Ellipse cx="30" cy="12" rx="9" ry="14" fill="none" stroke={colors.gold} strokeWidth="1.5" />
          <Ellipse cx="30" cy="48" rx="9" ry="14" fill="none" stroke={colors.gold} strokeWidth="1.5" />
          <Ellipse cx="12" cy="30" rx="14" ry="9" fill="none" stroke={colors.gold} strokeWidth="1.5" />
          <Ellipse cx="48" cy="30" rx="14" ry="9" fill="none" stroke={colors.gold} strokeWidth="1.5" />
          <Circle cx="30" cy="30" r="2.5" fill={colors.gold} />
        </Pattern>
        <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity="1" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </LinearGradient>
        <Mask id="m">
          <Rect width="100%" height="100%" fill="url(#fade)" />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#kawung)" mask="url(#m)" />
    </Svg>
  );
}

/** Ilustrasi siluet candi bertingkat. */
export function Candi({ size = 200 }) {
  return (
    <Svg width={size * 1.1} height={size} viewBox="0 0 220 200" accessibilityLabel="Ilustrasi siluet candi">
      <Circle cx="110" cy="96" r="88" fill={colors.navyRing} />
      <Rect x="104" y="18" width="12" height="18" rx="3" fill="#D9A441" />
      <Path d="M92 52 Q110 26 128 52 Z" fill="#D9A441" />
      <Rect x="84" y="52" width="52" height="16" rx="3" fill="#E7BC62" />
      <Rect x="70" y="72" width="80" height="18" rx="3" fill="#D9A441" />
      <Rect x="56" y="94" width="108" height="20" rx="3" fill="#C99332" />
      <Rect x="42" y="118" width="136" height="22" rx="3" fill="#B98326" />
      <Rect x="28" y="144" width="164" height="24" rx="3" fill="#A6741F" />
      <Rect x="100" y="146" width="20" height="22" rx="2" fill={colors.navyDeep} />
      <Rect x="18" y="172" width="184" height="6" rx="3" fill="#D9A441" opacity="0.5" />
    </Svg>
  );
}
