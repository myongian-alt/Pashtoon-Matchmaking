import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const featureItems = [
  { icon: 'account-group', title: 'Trusted community', tint: 'emerald' },
  { icon: 'account-check', title: 'Verified profiles', tint: 'gold' },
  { icon: 'ring', title: 'Serious marriage only', tint: 'emerald' },
  { icon: 'lock', title: 'Privacy', tint: 'gold' },
] as const;
const weddingImage = require('../../assets/pashtoon-hero.jpg');

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const pulse = useMemo(() => new Animated.Value(0), []);
  const featureAnims = useMemo(() => featureItems.map(() => new Animated.Value(0)), []);

  useEffect(() => {
    Animated.stagger(
      100,
      featureAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 420, useNativeDriver: false })
      )
    ).start();
  }, [featureAnims]);

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

        <View style={styles.featureGrid}>
          {featureItems.map((item, index) => (
            <Animated.View
              key={item.title}
              style={[
                styles.featureCard,
                item.tint === 'gold' ? styles.featureCardGold : styles.featureCardEmerald,
                {
                  opacity: featureAnims[index],
                  transform: [
                    {
                      translateY: featureAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                    { scale: ringScale },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.featureIconBadge,
                  item.tint === 'gold' ? styles.featureIconBadgeGold : styles.featureIconBadgeEmerald,
                ]}
              >
                <MaterialCommunityIcons name={item.icon as any} size={18} color="#fff" />
              </View>
              <Text style={styles.featureText}>{item.title}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.bottomText}>
          Tap Next to review our community agreement and continue.
        </Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Declaration' as never)}>
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
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
    maxWidth: 420,
    height: width * 0.38,
    borderRadius: 24,
    marginBottom: 10,
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
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  featureCard: {
    width: '46%',
    minWidth: 132,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  featureCardEmerald: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: 'rgba(19, 78, 54, 0.18)',
  },
  featureCardGold: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: 'rgba(140, 102, 54, 0.22)',
  },
  featureIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureIconBadgeEmerald: {
    backgroundColor: theme.colors.primary,
  },
  featureIconBadgeGold: {
    backgroundColor: theme.colors.accentDeep,
  },
  featureText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E3D7C4',
    backgroundColor: '#F7E1C9',
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