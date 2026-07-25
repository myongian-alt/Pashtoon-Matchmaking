import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { GentleNudge } from '../../lib/aiCoach';

type GentleNudgeBannerProps = {
  nudge: GentleNudge | null;
  onAction: () => void;
  onDismiss: () => void;
};

export function GentleNudgeBanner({ nudge, onAction, onDismiss }: GentleNudgeBannerProps) {
  if (!nudge) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.kicker}>Gentle Nudge</Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.title}>{nudge.title}</Text>
      <Text style={styles.body}>{nudge.body}</Text>

      <Pressable style={styles.actionButton} onPress={onAction}>
        <Text style={styles.actionText}>{nudge.actionLabel || 'Take action'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF5E5',
    borderWidth: 1,
    borderColor: '#EED8BA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#1F2924',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'Georgia',
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
