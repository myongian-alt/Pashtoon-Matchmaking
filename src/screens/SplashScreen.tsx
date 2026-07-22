import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export default function SplashScreen() {
  const navigation = useNavigation();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => navigation.navigate('Onboarding' as never), 1400);
    });
  }, [navigation, opacity, translateY]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.brand, { opacity, transform: [{ translateY }] }]}>        
        <View style={styles.logoCircle} />
        <Text style={styles.title}>Khpalwali</Text>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>        
        <Text style={styles.subtitle}>Where traditions meet modern relationships.</Text>
        <View style={styles.dotRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: theme.colors.primary,
    marginBottom: 18,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 8,
  },
  title: {
    color: theme.colors.primary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  content: {
    alignItems: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
    marginHorizontal: 8,
  },
});
