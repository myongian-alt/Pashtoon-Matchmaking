import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface LinkTextProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function LinkText({ label, onPress, style }: LinkTextProps) {
  return (
    <Pressable onPress={onPress} style={style}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
