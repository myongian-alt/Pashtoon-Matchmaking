import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

interface ProgressBadgeProps {
  value: number;
  label: string;
}

export function ProgressBadge({ value, label }: ProgressBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>{value}%</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'center',
  },
  value: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  label: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
