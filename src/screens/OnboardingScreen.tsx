import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { fonts } from '../theme/typography';
import { ArchFrame } from '../components/common/ArchFrame';

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
          <Text style={styles.pashtoGreeting}>پخیر راغلئ</Text>
          <Text style={styles.brand}>Khpalwali</Text>
          <Text style={styles.brandSubtitle}>PASHTOON MATCHMAKING</Text>

          <Animated.View style={{ transform: [{ translateY: float }], marginTop: 18, marginBottom: 18 }}>
            <ArchFrame width={Math.min(width - 48, 320)} height={(Math.min(width - 48, 320) * 0.82)} borderColor={theme.colors.gold}>
              <Image source={weddingImage} style={styles.heroImage} resizeMode="cover" />
            </ArchFrame>
          </Animated.View>

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
          <Text style={styles.buttonText}>Begin your journey</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.emeraldDeep,
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
    color: theme.colors.lightTextOnDark,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
  },
  hero: {
    marginTop: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  pashtoGreeting: {
    fontFamily: fonts.greeting,
    fontSize: 20,
    color: theme.colors.goldLight,
    marginBottom: 6,
  },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 42,
    color: theme.colors.lightTextOnDark,
  },
  brandSubtitle: {
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 3,
    color: theme.colors.goldLight,
    marginTop: 2,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 30,
    color: theme.colors.lightTextOnDark,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 38,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15.5,
    lineHeight: 24,
    color: theme.colors.goldPale,
    textAlign: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 18,
  },
  heroTextWrapper: {
    marginTop: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
  },
  featureCardEmerald: {
    backgroundColor: 'rgba(227, 238, 232, 0.12)',
    borderColor: 'rgba(227, 238, 232, 0.2)',
  },
  featureCardGold: {
    backgroundColor: 'rgba(231, 194, 122, 0.16)',
    borderColor: 'rgba(231, 194, 122, 0.3)',
  },
  featureIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconBadgeEmerald: {
    backgroundColor: theme.colors.emerald,
  },
  featureIconBadgeGold: {
    backgroundColor: theme.colors.gold,
  },
  featureText: {
    flexShrink: 1,
    color: theme.colors.lightTextOnDark,
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    lineHeight: 16,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 235, 211, 0.15)',
    backgroundColor: theme.colors.emeraldDeep,
  },
  bottomText: {
    color: theme.colors.goldPale,
    textAlign: 'center',
    marginBottom: 14,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.ink,
    fontFamily: fonts.labelBold,
    fontSize: 16,
  },
});