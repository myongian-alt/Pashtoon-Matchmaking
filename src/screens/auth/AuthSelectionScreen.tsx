import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { LinkText } from '../../components/common/LinkText';

export default function AuthSelectionScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Khpalwali</Text>
        </View>
        <Text style={styles.heading}>Welcome back to your Pashtoon matchmaking hub.</Text>
        <Text style={styles.subtext}>
          Choose how you want to connect — with email, phone, or simply explore as a guest.
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable style={styles.methodCard} onPress={() => navigation.navigate('EmailAuth' as never)}>
          <View style={styles.methodIcon}>
            <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.methodLabel}>Continue with Email</Text>
          <Text style={styles.methodDescription}>Use your email to keep your profile secure and family friendly.</Text>
        </Pressable>

        <Pressable style={styles.methodCard} onPress={() => navigation.navigate('PhoneAuth' as never)}>
          <View style={styles.methodIcon}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.methodLabel}>Login with Phone</Text>
          <Text style={styles.methodDescription}>Receive a secure code and connect with trusted profiles.</Text>
        </Pressable>

        <Pressable style={[styles.methodCard, styles.guestCard]} onPress={() => navigation.navigate('Tabs' as never)}>
          <View style={[styles.methodIcon, styles.guestIcon]}>
            <MaterialCommunityIcons name="account-heart-outline" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.methodLabel}>Continue as Guest</Text>
          <Text style={styles.methodDescription}>Browse profiles and discover the platform without signing up yet.</Text>
        </Pressable>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>By continuing, you agree to our </Text>
        <LinkText label="Privacy Policy" onPress={() => {}} />
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>and </Text>
        <LinkText label="Terms" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  hero: {
    marginTop: 42,
    marginBottom: 24,
  },
  heroBadge: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroBadgeText: {
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 40,
    maxWidth: 320,
  },
  subtext: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 360,
  },
  buttons: {
    marginTop: 24,
  },
  methodCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  guestCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceSoft,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestIcon: {
    backgroundColor: '#FFF5E5',
  },
  methodLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  methodDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});
