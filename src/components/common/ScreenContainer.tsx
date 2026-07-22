import React from 'react';
import { SafeAreaView, StyleSheet, View, ViewProps } from 'react-native';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
}

export function ScreenContainer({ children, style, ...props }: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.container, style]} {...props}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5EE',
  },
  inner: {
    flex: 1,
  },
});
