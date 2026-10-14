import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { fonts } from '../../theme/typography';

// Single shared badge so "genuine and verified" reads identically wherever
// a profile appears - Discover grid cards, Match cards, and the full
// Profile Detail screen - rather than each screen inventing its own look.
export function VerifiedBadge({ size = 'small' }: { size?: 'small' | 'large' }) {
  const isLarge = size === 'large';

  return (
    <View style={[styles.badge, isLarge && styles.badgeLarge]}>
      <MaterialCommunityIcons name="check-decagram" size={isLarge ? 14 : 11} color="#fff" />
      <Text style={[styles.text, isLarge && styles.textLarge]}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    backgroundColor: theme.colors.statusVerified,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  badgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  text: {
    color: '#fff',
    fontFamily: fonts.labelBold,
    fontSize: 9.5,
  },
  textLarge: {
    fontSize: 12,
  },
});
