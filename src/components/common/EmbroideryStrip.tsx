import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../../theme';

// A band of small rotated-square "diamonds", evenly spaced — the Pashtun-
// embroidery-inspired strip that sits under every section header in the
// redesign. Generalized out of a near-identical one-off pattern that
// already existed only in ChooseGenderScreen (`motifRow`/`motifDiamond`) so
// every header can share it instead of re-implementing the same row.
export function EmbroideryStrip({
  color = theme.colors.goldLight,
  background,
  count = 12,
}: {
  color?: string;
  background?: string;
  count?: number;
}) {
  return (
    <View style={[styles.row, background ? { backgroundColor: background } : null]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.diamond, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  diamond: {
    width: 7,
    height: 7,
    transform: [{ rotate: '45deg' }],
  },
});
