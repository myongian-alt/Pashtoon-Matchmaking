import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const featureItems = [
  { icon: 'account-group', title: 'Trusted community' },
  { icon: 'account-check', title: 'Verified profiles' },
  { icon: 'ring', title: 'Serious marriage only' },
  { icon: 'lock', title: 'Privacy' },
];
const weddingImage = require('../../assets/pashtoon-hero.jpg');

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const pulse = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulse]);

  const float = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });
  const ringScale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.06, 1],
  });
  const ringRotate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg'],
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header} />

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText} numberOfLines={1}>
              {' Pashtoon Matchmaking'}
            </Text>
          </View>

          <Animated.Image
            source={weddingImage}
            style={[styles.heroImage, { transform: [{ translateY: float }] }]}
            resizeMode="cover"
          />

          <View style={styles.heroTextWrapper}>
            <Text style={styles.heading}>
              Your wedding story begins with trust.
            </Text>
            <Text style={styles.subtitle}>
              Discover a respectful Pashtoon matchmaking experience built for family values and serious relationships.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureScroll}>
          {featureItems.map((item) => (
            <View key={item.title} style={styles.featureChip}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name={item.icon as any} size={14} color="#ffffff" />
              </View>
              <Text style={styles.featureText}>{item.title}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.bottomText}>
            Tap Next to continue to the gender selection and auth flow.
          </Text>
          <Pressable style={styles.button} onPress={() => navigation.navigate('ChooseGender' as never)}>
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E1C9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'flex-end',
  },
  skip: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  hero: {
    marginTop: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  heroBadge: {
    backgroundColor: '#F3E4D8',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#C9A46F',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
    width: '90%',
    maxWidth: 520,
    minWidth: 280,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeText: {
    color: '#6F4327',
    fontWeight: '900',
    fontSize: 26,
    letterSpacing: 1,
    textTransform: 'none',
    fontStyle: 'italic',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  heroImage: {
    width: '100%',
    maxWidth: 520,
    height: width * 0.52,
    borderRadius: 28,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 30,
    elevation: 12,
  },
  avatarShell: {
    width: 0,
    height: 0,
  },
  avatarCircle: {
    width: 0,
    height: 0,
  },
  heading: {
    fontSize: 34,
    fontWeight: '900',
    color: '#5B3A25',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 48,
    paddingHorizontal: 16,
    textShadowColor: '#C9A673',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'serif',
  },
  headingAccent: {
    color: '#7B512B',
    fontStyle: 'italic',
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4B3825',
    textAlign: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 18,
  },
  subtitleAccent: {
    color: '#7B512B',
    fontWeight: '900',
  },
  heroTextWrapper: {
    marginTop: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  bottomSection: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E3D7C4',
    backgroundColor: '#F7E1C9',
  },
  featureScroll: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#0e3a28',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 3,
    minHeight: 44,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 10,
    backgroundColor: '#245f44',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    maxWidth: 120,
  },
  footer: {
    paddingVertical: 16,
    paddingBottom: 8,
  },
  bottomText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});