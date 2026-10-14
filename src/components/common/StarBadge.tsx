import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { theme } from '../../theme';
import { fonts } from '../../theme/typography';

// An 8-point star outline — the repeated motif behind match scores, avatar
// badges, and icon badges throughout the redesign. Built as an actual SVG
// polygon (not an image asset) so it stays crisp at any size the caller
// needs, from a small icon badge up to a large match-score badge.
function starPoints(cx: number, cy: number, outerR: number, innerR: number, points = 8): string {
  const step = Math.PI / points;
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    // Start pointing straight up, matching how the mockup's badges sit.
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    coords.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return coords.join(' ');
}

export function StarBadge({
  size = 48,
  color = theme.colors.lapis,
  children,
}: {
  size?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const half = size / 2;
  const points = starPoints(half, half, half, half * 0.74);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Polygon points={points} fill={color} />
      </Svg>
      {children != null && <View style={styles.content}>{children}</View>}
    </View>
  );
}

// Convenience wrapper for the common "percentage match score inside a star"
// case, e.g. Discover cards and profile detail headers.
export function MatchScoreStar({ percent, size = 56 }: { percent: number; size?: number }) {
  return (
    <StarBadge size={size} color={theme.colors.lapis}>
      <Text style={[styles.percentText, { fontSize: size * 0.27 }]}>{percent}%</Text>
      <Text style={[styles.matchText, { fontSize: size * 0.14 }]}>MATCH</Text>
    </StarBadge>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: fonts.labelBold,
    color: '#fff',
  },
  matchText: {
    fontFamily: fonts.label,
    color: theme.colors.goldLight,
    letterSpacing: 0.5,
  },
});
