import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { fonts } from '../theme/typography';

// Full legal text, unchanged — still shown in full via "Read the full
// declaration", just no longer the default view. The four PLEDGES below are
// a condensed summary of the same commitments, not a replacement for them.
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

const PLEDGES: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  title: string;
  text: string;
}[] = [
  { icon: 'heart', color: theme.colors.emerald, title: 'Sincere intention', text: "I'm here only to find a marriage partner." },
  { icon: 'hand-heart', color: theme.colors.gold, title: 'Respect & haya', text: 'Decent words, no harassment — honouring Pashtunwali and Islamic adab.' },
  { icon: 'lock', color: theme.colors.pomegranateDeep, title: 'Privacy is amanah', text: "I won't screenshot, share or record anyone's photos or chats." },
  { icon: 'shield-check', color: theme.colors.lapis, title: 'Truthful profile', text: 'Real name, age and marital status. No fake accounts.' },
];

export default function DeclarationScreen() {
  const navigation = useNavigation();
  const [agreed, setAgreed] = useState(false);
  const [showFull, setShowFull] = useState(false);

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
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.emerald} />
        </Pressable>

        <Text style={styles.eyebrow}>Step 1 of 4 · Our Amanah</Text>
        <Text style={styles.title}>
          The Khpalwali <Text style={styles.titleItalic}>Pledge</Text>
        </Text>
        <Text style={styles.lead}>A place for nikah, not dating. Four promises keep it safe for every family.</Text>

        <View style={styles.list}>
          {PLEDGES.map((pledge) => (
            <View key={pledge.title} style={styles.pledgeCard}>
              <View
                style={[
                  styles.pledgeIconBadge,
                  { backgroundColor: pledge.color, shadowColor: pledge.color },
                ]}
              >
                <MaterialCommunityIcons name={pledge.icon} size={24} color="#fff" />
              </View>
              <View style={styles.pledgeCopy}>
                <Text style={[styles.pledgeTitle, { color: pledge.color }]}>{pledge.title}</Text>
                <Text style={styles.pledgeText}>{pledge.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.expandRow}
          onPress={() => setShowFull((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showFull ? 'Hide the full declaration' : 'Read the full declaration, 8 points'}
        >
          <Text style={styles.expandText}>
            {showFull ? 'Hide the full declaration' : 'Read the full declaration (8 points)'}
          </Text>
          <MaterialCommunityIcons name={showFull ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.emerald} />
        </Pressable>

        {showFull && (
          <View style={styles.fullList}>
            {DECLARATIONS.map((text, index) => (
              <View key={index} style={styles.listRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.listText}>{text}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setAgreed((prev) => !prev)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel="I accept this pledge. Violations may lead to suspension."
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>I accept this pledge. Violations may lead to suspension.</Text>
        </Pressable>
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
          <Text style={[styles.continueText, !agreed && styles.continueTextDisabled]}>I Accept & Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ivory,
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
    backgroundColor: theme.colors.invitationCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.gold,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 34,
    color: theme.colors.ink,
    marginBottom: 10,
  },
  titleItalic: {
    fontFamily: fonts.bodyItalic,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.mutedText,
    marginBottom: 22,
  },
  list: {
    gap: 12,
    marginBottom: 14,
  },
  pledgeCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: theme.colors.invitationCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    alignItems: 'center',
  },
  pledgeIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  pledgeCopy: {
    flex: 1,
    gap: 3,
  },
  pledgeTitle: {
    fontFamily: fonts.labelBold,
    fontSize: 15,
  },
  pledgeText: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.colors.bodyText,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 14,
  },
  expandText: {
    fontFamily: fonts.labelBold,
    fontSize: 13.5,
    color: theme.colors.emerald,
  },
  fullList: {
    gap: 16,
    marginBottom: 20,
    paddingTop: 4,
  },
  listRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.emeraldTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numberBadgeText: {
    fontFamily: fonts.labelBold,
    fontSize: 12,
    color: theme.colors.emerald,
  },
  listText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.ink,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: theme.colors.goldPale + '55',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.invitationGoldLine,
    padding: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.emerald,
    borderColor: theme.colors.emerald,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.ink,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.ivory,
  },
  continueButton: {
    backgroundColor: theme.colors.emerald,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: theme.colors.emerald,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.cardBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    fontFamily: fonts.labelBold,
    fontSize: 16.5,
    color: '#fff',
    letterSpacing: 0.2,
  },
  continueTextDisabled: {
    color: theme.colors.faintText,
  },
});
