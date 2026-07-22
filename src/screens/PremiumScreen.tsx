import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const benefits = [
  'Unlimited likes and favorites',
  'Reveal contact details securely',
  'Advanced matching filters',
  'Priority support and featured placement',
  'Verified premium trust badge',
];

export default function PremiumScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Khpalwali Premium</Text>
      <Text style={styles.subtitle}>Unlock the full premium experience for serious families and trusted connections.</Text>

      <View style={styles.priceCard}>
        <Text style={styles.priceTitle}>USD 30 / month</Text>
        <Text style={styles.priceNote}>Billed monthly for unlimited access and priority features.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Premium benefits</Text>
        {benefits.map((item) => (
          <View key={item} style={styles.benefitRow}>
            <View style={styles.benefitDot} />
            <Text style={styles.benefitLabel}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.paymentTitle}>Payment methods</Text>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentMethod}>Credit Card</Text>
          <Text style={styles.paymentMethod}>Apple Pay</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentMethod}>Google Pay</Text>
          <Text style={styles.paymentMethod}>PayPal</Text>
        </View>
        <Text style={styles.paymentNote}>Also support local payment methods based on your region.</Text>
      </View>

      <Pressable style={styles.subscribeButton} onPress={() => {}}>
        <Text style={styles.subscribeText}>Subscribe now</Text>
      </Pressable>

      <Pressable style={styles.contactAdmin} onPress={() => {}}>
        <Text style={styles.contactAdminText}>Contact Admin</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back to home</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 340,
  },
  priceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 26,
  },
  priceTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 10,
  },
  priceNote: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 28,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  benefitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
    marginRight: 12,
  },
  benefitLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  paymentSection: {
    marginBottom: 28,
  },
  paymentTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentMethod: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  paymentNote: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  contactAdmin: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  contactAdminText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
});
