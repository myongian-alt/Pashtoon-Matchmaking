import React, { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { fonts } from '../theme/typography';
import { useUser } from '../context/UserContext';
import { ArchFrame } from '../components/common/ArchFrame';
import { EmbroideryStrip } from '../components/common/EmbroideryStrip';

const ARCH_SIZE = 108;

const OPTIONS = [
  {
    key: 'male' as const,
    label: 'Groom-to-be',
    pashto: 'د واده زلمی',
    icon: 'account' as const,
    archColor: theme.colors.emerald,
    archBg: theme.colors.emeraldTint,
  },
  {
    key: 'female' as const,
    label: 'Bride-to-be',
    pashto: 'ناوې',
    icon: 'flower-tulip' as const,
    archColor: theme.colors.pomegranateDeep,
    archBg: theme.colors.pomegranateTint,
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
  const checkScale = useRef(new Animated.Value(isSelected ? 1 : 0.4)).current;
  const checkOpacity = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

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
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${option.label}, ${option.pashto}`}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <ArchFrame width={ARCH_SIZE} height={ARCH_SIZE} borderColor={option.archColor}>
        <View style={[styles.archFill, { backgroundColor: option.archBg }]}>
          <MaterialCommunityIcons name={option.icon} size={42} color={option.archColor} />
        </View>
      </ArchFrame>

      <Text style={[styles.pashtoLabel, { color: option.archColor }]}>{option.pashto}</Text>
      <Text style={styles.cardLabel}>{option.label}</Text>

      <Animated.View
        style={[
          styles.checkBadge,
          {
            backgroundColor: option.archColor,
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
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
        <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.emerald} />
      </Pressable>

      <Text style={styles.eyebrow}>Step 2 of 4</Text>
      <View style={styles.intro}>
        <Text style={styles.title}>
          Who's <Text style={styles.titleItalic}>joining?</Text>
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

      <View style={styles.stripWrap}>
        <EmbroideryStrip color={theme.colors.goldLight} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ivory,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: theme.colors.invitationCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  eyebrow: {
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.gold,
    marginBottom: 10,
    textAlign: 'center',
  },
  intro: {
    alignItems: 'center',
    marginBottom: 34,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  titleItalic: {
    fontFamily: fonts.bodyItalic,
  },
  options: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 180,
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.invitationCard,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  cardSelected: {
    borderColor: theme.colors.gold,
    borderWidth: 2.5,
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  archFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pashtoLabel: {
    fontFamily: fonts.notoNaskh,
    fontSize: 15,
    marginTop: 14,
  },
  cardLabel: {
    fontFamily: fonts.cardTitleItalic,
    fontSize: 18,
    color: theme.colors.ink,
    marginTop: 2,
    textAlign: 'center',
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
  stripWrap: {
    marginTop: 8,
  },
});
