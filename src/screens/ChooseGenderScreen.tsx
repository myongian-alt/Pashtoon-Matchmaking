import React, { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';

const PALETTE = {
  goldDeep: '#8C6636',
  goldSoft: '#F4E9D4',
  emeraldGlow: 'rgba(19, 78, 54, 0.16)',
  goldGlow: 'rgba(173, 129, 74, 0.22)',
};

const OPTIONS = [
  {
    key: 'male' as const,
    label: 'Male',
    description: 'Seek respectful, family-approved matches.',
    icon: 'ring' as const,
    cardBg: theme.colors.primarySoft,
    cardBorder: 'rgba(19, 78, 54, 0.3)',
    badgeBg: theme.colors.primary,
    selectedBorder: theme.colors.primary,
    selectedGlow: PALETTE.emeraldGlow,
    checkBg: theme.colors.primary,
  },
  {
    key: 'female' as const,
    label: 'Female',
    description: 'Discover meaningful connections with shared values.',
    icon: 'flower-tulip' as const,
    cardBg: PALETTE.goldSoft,
    cardBorder: 'rgba(140, 102, 54, 0.34)',
    badgeBg: PALETTE.goldDeep,
    selectedBorder: PALETTE.goldDeep,
    selectedGlow: PALETTE.goldGlow,
    checkBg: PALETTE.goldDeep,
  },
];

function GenderCard({
  option,
  isSelected,
  onSelect,
}: {
  option: (typeof OPTIONS)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const badgeScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(isSelected ? 1 : 0.4)).current;
  const checkOpacity = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  const handlePress = () => {
    onSelect();
    Animated.sequence([
      Animated.spring(badgeScale, { toValue: 1.08, useNativeDriver: true, speed: 30, bounciness: 10 }),
      Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
  };

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: isSelected ? 1 : 0.4,
        useNativeDriver: true,
        speed: 24,
        bounciness: 10,
      }),
      Animated.timing(checkOpacity, {
        toValue: isSelected ? 1 : 0,
        duration: isSelected ? 220 : 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${option.label}. ${option.description}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: option.cardBg, borderColor: option.cardBorder },
        pressed && styles.cardPressed,
        isSelected && {
          borderColor: option.selectedBorder,
          borderWidth: 2.5,
          shadowColor: option.selectedBorder,
          shadowOpacity: 0.3,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        },
      ]}
    >
      {isSelected && <View style={[styles.cardGlowRing, { borderColor: option.selectedGlow }]} pointerEvents="none" />}

      <Animated.View
        style={[
          styles.iconBadge,
          { backgroundColor: option.badgeBg, transform: [{ scale: badgeScale }] },
        ]}
      >
        <MaterialCommunityIcons name={option.icon} size={30} color="#fff" />
      </Animated.View>

      <View style={styles.cardCopy}>
        <Text style={styles.cardLabel}>{option.label}</Text>
        <Text style={styles.cardDescription}>{option.description}</Text>
      </View>

      <Animated.View
        style={[
          styles.checkBadge,
          {
            backgroundColor: option.checkBg,
            opacity: checkOpacity,
            transform: [{ scale: checkScale }],
          },
        ]}
      >
        <MaterialCommunityIcons name="check" size={14} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

// Time for the selection glow/checkmark animation to read before the screen
// advances - long enough to confirm the tap landed, short enough that it
// doesn't feel like a delay.
const AUTO_ADVANCE_DELAY = 420;

export default function ChooseGenderScreen() {
  const navigation = useNavigation();
  const { setSelectedGender } = useUser();
  const [selected, setSelected] = useState<'male' | 'female' | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const handleSelect = (gender: 'male' | 'female') => {
    setSelected(gender);
    setSelectedGender(gender);

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }
    advanceTimeoutRef.current = setTimeout(() => {
      navigation.navigate('AuthSelection' as never);
    }, AUTO_ADVANCE_DELAY);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <LinearGradient
        pointerEvents="none"
        style={styles.ambientBlobTop}
        colors={['rgba(173,129,74,0.24)', 'rgba(173,129,74,0)']}
        start={{ x: 0.25, y: 0.15 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        pointerEvents="none"
        style={styles.ambientBlobBottom}
        colors={['rgba(19,78,54,0.16)', 'rgba(19,78,54,0)']}
        start={{ x: 0.75, y: 0.85 }}
        end={{ x: 0, y: 0 }}
      />

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
        <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.primary} />
      </Pressable>

      <View style={styles.motifRow} aria-hidden={true}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={styles.motifDiamond} />
        ))}
      </View>

      <View style={styles.intro}>
        <Text style={styles.eyebrow}>Begin your journey</Text>
        <Text style={styles.title}>Select your gender</Text>
        <Text style={styles.subtitle}>
          The first step toward a tailored Pashtoon matchmaking experience.
        </Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <GenderCard
            key={option.key}
            option={option}
            isSelected={selected === option.key}
            onSelect={() => handleSelect(option.key)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
  },
  ambientBlobTop: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  ambientBlobBottom: {
    position: 'absolute',
    top: 260,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  motifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 13,
  },
  motifDiamond: {
    width: 7,
    height: 7,
    backgroundColor: theme.colors.accent,
    transform: [{ rotate: '45deg' }],
    opacity: 0.6,
  },
  intro: {
    alignItems: 'center',
    marginBottom: 34,
  },
  eyebrow: {
    fontFamily: 'Fraunces_500Medium_Italic',
    fontSize: 14,
    color: PALETTE.goldDeep,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 32,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'Karla_400Regular',
    fontSize: 15.5,
    lineHeight: 23,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  options: {
    gap: 16,
    marginBottom: 28,
  },
  card: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 44,
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardGlowRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
    borderWidth: 5,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardCopy: {
    alignItems: 'center',
    gap: 6,
  },
  cardLabel: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: theme.colors.text,
    textAlign: 'center',
  },
  cardDescription: {
    fontFamily: 'Karla_400Regular',
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 14,
    right: 14,
  },
});
