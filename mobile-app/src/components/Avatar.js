import { Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { findAvatar } from '../lib/avatars';
import { colors, font, initials } from '../lib/theme';

/** Avatar bawaan bila sudah dipilih (user.avatarId); jika belum, tampilkan inisial nama. */
export function Avatar({ user, avatarId, size = 88, style }) {
  const avatar = findAvatar(avatarId !== undefined ? avatarId : user?.avatarId);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatar ? avatar.bg : colors.goldSoft,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {avatar ? (
        <MaterialCommunityIcons name={avatar.icon} size={size * 0.52} color={avatar.fg} />
      ) : (
        <Text style={{ ...font.extrabold, color: colors.navy, fontSize: size * 0.34 }}>{initials(user?.name)}</Text>
      )}
    </View>
  );
}
