import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Kawung } from './Ornament';
import { colors, font, space } from '../lib/theme';

/** Ambil ID video dari tautan youtube.com/watch?v=, youtu.be/, atau /embed/. */
export function youtubeId(url = '') {
  const m = /(?:v=|youtu\.be\/|embed\/)([\w-]+)/.exec(url);
  return m ? m[1] : null;
}

export function VideoPlayer({ url }) {
  const id = youtubeId(url);
  const isPlaceholder = !id || id.startsWith('TODO');

  if (isPlaceholder) {
    return (
      <View style={[styles.frame, styles.placeholder]}>
        <Kawung size={260} color={colors.goldInk} opacity={0.25} strokeWidth={0.8} style={{ alignSelf: 'center' }} />
        <View style={styles.playCircle}>
          <Ionicons name="videocam-off-outline" size={26} color={colors.goldInkDark} />
        </View>
        <Text style={styles.placeholderText}>Video belum tersedia</Text>
        <Text style={styles.placeholderSub}>Admin akan menambahkan tautan YouTube untuk bab ini.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.frame}>
        <WebView
          source={{ uri: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` }}
          style={{ flex: 1, backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
      </View>
      <Pressable
        onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${id}`)}
        style={styles.ytLink}
        hitSlop={8}
        accessibilityRole="link"
      >
        <Ionicons name="logo-youtube" size={16} color={colors.navy} />
        <Text style={styles.ytText}>Buka di YouTube</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 22, overflow: 'hidden', backgroundColor: '#000' },
  placeholder: { backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { ...font.extrabold, color: colors.goldInkDark, fontSize: 15, marginTop: space.sm },
  placeholderSub: { ...font.medium, color: colors.goldInk, fontSize: 12, textAlign: 'center', marginTop: 2 },
  ytLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  ytText: { ...font.bold, fontSize: 13, color: colors.navy },
});
