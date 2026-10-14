import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';

// Wraps a photo/avatar in the arched, gold-bordered "mosque arch" frame used
// throughout the redesign (Discover cards, profile headers, match avatars).
// Pure CSS, not an SVG/image asset: a very large top-corner radius (half the
// width) combined with a small bottom-corner radius reads as a rounded arch
// without needing a vector shape — cheaper to render at FlatList scale, and
// trivially resizes to whatever the caller's photo size already is. This
// wraps whatever's already rendering the actual photo (e.g.
// ModernMuslimAvatar, a profile_photos URL) — it doesn't replace that data
// logic, just the border/shape around it.
export function ArchFrame({
  width,
  height,
  borderColor = theme.colors.gold,
  borderWidth = 2.5,
  style,
  children,
}: {
  width: number;
  height: number;
  borderColor?: string;
  borderWidth?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const archRadius = width / 2;

  return (
    <View
      style={[
        styles.frame,
        {
          width,
          height,
          borderColor,
          borderWidth,
          borderTopLeftRadius: archRadius,
          borderTopRightRadius: archRadius,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: theme.colors.sand,
  },
});
