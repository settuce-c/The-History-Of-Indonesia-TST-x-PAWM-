import { Linking, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, space } from '../lib/theme';
import { Button } from './ui';

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
        <Ionicons name="videocam-off" size={36} color={colors.goldSoft} />
        <Text style={styles.placeholderText}>Video belum tersedia</Text>
        <Text style={styles.placeholderSub}>Admin akan menambahkan tautan YouTube untuk bab ini.</Text>
      </View>
    );
  }

  return (
    <View>
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
      <Button
        title="Buka di YouTube"
        icon="logo-youtube"
        variant="ghost"
        onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${id}`)}
        style={{ marginTop: space.xs }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' },
  placeholder: { backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  placeholderText: { color: '#fff', fontWeight: '700', fontSize: 16, marginTop: space.sm },
  placeholderSub: { color: colors.goldSoft, fontSize: 13, textAlign: 'center', marginTop: 4 },
});
