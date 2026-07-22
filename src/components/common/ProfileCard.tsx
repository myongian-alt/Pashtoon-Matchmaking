import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

interface ProfileCardProps {
  name: string;
  age: number;
  location: string;
  education: string;
  compatibility: number;
  tag?: string;
  onPress: () => void;
  onSecondaryPress?: () => void;
  actionLabel?: string;
}

export function ProfileCard({
  name,
  age,
  location,
  education,
  compatibility,
  tag,
  onPress,
  onSecondaryPress,
  actionLabel = 'View Profile',
}: ProfileCardProps) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.name}>{name}, {age}</Text>
            <Text style={styles.location}>{location}</Text>
          </View>
          {tag ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.education}>{education}</Text>
      <Text style={styles.description}>Family-centred, values tradition and meaningful marriage goals.</Text>

      <View style={styles.detailRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{compatibility}%</Text>
          <Text style={styles.metricLabel}>Match score</Text>
        </View>
        <View style={styles.metricCardSoft}>
          <Text style={styles.metricLabel}>Saved</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={onPress}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onSecondaryPress}>
          <Text style={styles.secondaryLabel}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  metaRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  name: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  location: {
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tag: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 18,
    padding: 14,
  },
  metricCardSoft: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  education: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginBottom: 12,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 12,
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});
