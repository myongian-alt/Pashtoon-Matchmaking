import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function AuthButton({ label, onPress, variant = 'primary', style }: AuthButtonProps) {
  const backgroundColor = variant === 'primary' ? theme.colors.primary : theme.colors.surface;
  const textColor = variant === 'primary' ? '#FFF' : theme.colors.primary;

  return (
    <Pressable style={[styles.button, { backgroundColor }, style]} onPress={onPress}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 11 },
    shadowRadius: 21,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
