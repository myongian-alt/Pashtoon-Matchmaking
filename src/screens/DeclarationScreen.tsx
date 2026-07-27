import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const DECLARATIONS = [
  'I am joining this platform solely for the purpose of seeking a genuine marriage partner. I understand that this is a matrimonial platform, not a dating or casual relationship platform.',
  'I will use this platform honestly, respectfully, and with sincere intentions. I will not engage in harassment, inappropriate conversations, flirting for entertainment, or any behaviour inconsistent with the purpose of marriage.',
  "I will respect the privacy, dignity, and personal information of all members. I will not share, copy, screenshot, record, or distribute another user's profile, photographs, or conversations without their explicit permission.",
  'I will communicate in a respectful and decent manner at all times. I will not use offensive, abusive, discriminatory, vulgar, or inappropriate language or behaviour.',
  'I acknowledge that this platform is built with respect for Pashtoon values, traditions, culture, and Islamic principles. I agree to conduct myself in a manner that honours these values while treating every member with respect, regardless of their background.',
  'I will provide truthful and accurate information in my profile and will not impersonate another person, create fake accounts, or misrepresent my identity, marital status, age, or other personal details.',
  'I understand that any misuse of this platform, including using it for dating, scams, fraudulent activities, commercial purposes, or any activity contrary to its intended purpose, is strictly prohibited.',
  'I understand that the platform reserves the right to review reports of misconduct and take appropriate action to protect the community.',
];

export default function DeclarationScreen() {
  const navigation = useNavigation();
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (agreed) {
      navigation.navigate('ChooseGender' as never);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.primary} />
        </Pressable>

        <View style={styles.headerIconBadge}>
          <MaterialCommunityIcons name="shield-check-outline" size={30} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>User Declaration &{'\n'}Community Agreement</Text>
        <Text style={styles.lead}>By creating an account and using this platform, I declare that:</Text>

        <View style={styles.list}>
          {DECLARATIONS.map((text, index) => (
            <View key={index} style={styles.listRow}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.listText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ackCard}>
          <Text style={styles.ackTitle}>Acknowledgement</Text>
          <Text style={styles.ackText}>
            By checking the box below and continuing, I confirm that I have read, understood, and agree to comply
            with this Declaration and Community Agreement.
          </Text>
        </View>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setAgreed((prev) => !prev)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel="I have read, understood, and agree to comply with this Declaration and Community Agreement"
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read, understood, and agree to comply with this Declaration and Community Agreement.
          </Text>
        </Pressable>

        <Text style={styles.warningText}>
          I understand that any violation of these terms may result in the immediate suspension or permanent
          deletion of my account without prior notice, at the sole discretion of the platform administrators, in
          order to maintain a safe, respectful, and trustworthy matrimonial community.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.continueButton, !agreed && styles.continueButtonDisabled]}
          disabled={!agreed}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{ disabled: !agreed }}
        >
          <Text style={[styles.continueText, !agreed && styles.continueTextDisabled]}>
            I Agree &amp; Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  headerIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 26,
    lineHeight: 32,
    color: theme.colors.text,
    marginBottom: 12,
  },
  lead: {
    fontFamily: 'Karla_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  list: {
    gap: 16,
    marginBottom: 24,
  },
  listRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numberBadgeText: {
    fontFamily: 'Karla_700Bold',
    fontSize: 12,
    color: theme.colors.primary,
  },
  listText: {
    flex: 1,
    fontFamily: 'Karla_400Regular',
    fontSize: 14.5,
    lineHeight: 21,
    color: theme.colors.text,
  },
  ackCard: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(140, 102, 54, 0.25)',
    padding: 18,
    marginBottom: 18,
  },
  ackTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 17,
    color: theme.colors.text,
    marginBottom: 8,
  },
  ackText: {
    fontFamily: 'Karla_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: 'Karla_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  warningText: {
    fontFamily: 'Karla_400Regular',
    fontSize: 12.5,
    lineHeight: 19,
    color: theme.colors.danger,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    fontFamily: 'Karla_700Bold',
    fontSize: 16.5,
    color: '#fff',
    letterSpacing: 0.2,
  },
  continueTextDisabled: {
    color: theme.colors.muted,
  },
});
