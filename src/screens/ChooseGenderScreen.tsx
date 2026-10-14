import React, { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { fonts } from '../theme/typography';
import { useUser } from '../context/UserContext';
import { ArchFrame } from '../components/common/ArchFrame';
import { EmbroideryStrip } from '../components/common/EmbroideryStrip';
import { ModernMuslimAvatar } from '../components/common/ModernMuslimAvatar';

const ARCH_SIZE = 108;

const OPTIONS = [
  {
    key: 'male' as const,
    label: 'Groom-to-be',
    pashto: 'د واده زلمی',
    archColor: theme.colors.emerald,
    archBg: theme.colors.emeraldTint,
  },
  {
    key: 'female' as const,
    label: 'Bride-to-be',
    pashto: 'ناوې',
    archColor: theme.colors.pomegranateDeep,
    archBg: theme.colors.pomegranateTint,
  },
];

// Visual language selector only — sets which label renders below, not a full
// app-wide translation (that's separate, larger i18n/RTL work still ahead;
// see the project plan). English is the default per the brief.
const LANGUAGES: { key: 'en' | 'ps' | 'ur'; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ps', label: 'پښتو' },
  { key: 'ur', label: 'اردو' },
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
          <ModernMuslimAvatar gender={option.key} size={ARCH_SIZE - 16} />
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
  const insets = useSafeAreaInsets();
  const { setSelectedGender } = useUser();
  const [selected, setSelected] = useState<'male' | 'female' | null>(null);
  const [language, setLanguage] = useState<'en' | 'ps' | 'ur'>('en');
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.lightTextOnDark} />
        </Pressable>
        <Text style={styles.eyebrow}>Step 2 of 4</Text>
        <Text style={styles.title}>
          Who's <Text style={styles.titleItalic}>joining?</Text>
        </Text>

        <View style={styles.languageRow}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.key}
              onPress={() => setLanguage(lang.key)}
              style={[styles.languagePill, language === lang.key && styles.languagePillActive]}
            >
              <Text style={[styles.languageText, language === lang.key && styles.languageTextActive]}>
                {lang.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <EmbroideryStrip color={theme.colors.goldLight} background={theme.colors.pomegranateDeep} />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ivory,
  },
  header: {
    backgroundColor: theme.colors.emeraldDeep,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.goldLight,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: theme.colors.lightTextOnDark,
    marginBottom: 16,
  },
  titleItalic: {
    fontFamily: fonts.bodyItalic,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  languagePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  languagePillActive: {
    backgroundColor: theme.colors.gold,
  },
  languageText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: theme.colors.lightTextOnDark,
  },
  languageTextActive: {
    color: theme.colors.ink,
    fontFamily: fonts.labelBold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 32,
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
});
