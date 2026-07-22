import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const options = [
  { label: 'Male', description: 'Seek respectful, family-approved matches.', key: 'male', icon: 'gender-male' },
  { label: 'Female', description: 'Discover meaningful connections with shared values.', key: 'female', icon: 'gender-female' },
];

export default function ChooseGenderScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = React.useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.indicator} />
        <Text style={styles.title}>Select your gender</Text>
        <Text style={styles.subtitle}>
          The first step toward a tailored Pashtoon matchmaking experience.
        </Text>
      </View>

      <View style={styles.cards}>
        {options.map((option) => {
          const active = selected === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => setSelected(option.key)}
            >
              <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                <MaterialCommunityIcons name={option.icon as any} size={26} color={active ? '#fff' : theme.colors.primary} />
              </View>
              <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{option.label}</Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
        disabled={!selected}
        onPress={() => navigation.navigate('AuthSelection' as never)}
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  indicator: {
    width: 58,
    height: 6,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
    marginBottom: 18,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 340,
  },
  cards: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  cardActive: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    backgroundColor: theme.colors.surfaceSoft,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cardLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 10,
  },
  cardLabelActive: {
    color: theme.colors.primary,
  },
  cardDescription: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  continueButton: {
    marginTop: 'auto',
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
