import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { CoachTip } from '../../lib/aiCoach';

type ProfileCoachCardProps = {
  tips: CoachTip[];
  onTapTip?: () => void;
};

export function ProfileCoachCard({ tips, onTapTip }: ProfileCoachCardProps) {
  if (!tips.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="robot-excited-outline" size={16} color={theme.colors.primary} />
        <Text style={styles.title}>Profile Coach</Text>
      </View>

      {tips.map((tip) => (
        <Pressable key={tip.key} style={styles.tipRow} onPress={onTapTip}>
          <MaterialCommunityIcons name="lightning-bolt" size={12} color={theme.colors.primary} />
          <Text style={styles.tipTitle} numberOfLines={1}>{tip.title}</Text>
          <MaterialCommunityIcons name="chevron-right" size={15} color={theme.colors.textSecondary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF5E5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EED8BA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2924',
    fontFamily: 'Georgia',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1E2CE',
    paddingVertical: 8,
  },
  tipTitle: {
    flex: 1,
    color: '#1F2924',
    fontWeight: '600',
    fontSize: 12,
  },
});
