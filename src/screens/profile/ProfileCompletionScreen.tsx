import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { AppBottomNav } from '../../components/common/AppBottomNav';

export default function ProfileCompletionScreen() {
  const navigation = useNavigation();
  const { profileCompleted } = useUser();

  const handlePayment = () => {
    // Simulate payment processing
    navigation.navigate('PaymentSuccess' as never);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Unlock Message */}
        <View style={styles.messageCard}>
          <MaterialCommunityIcons name="lock" size={48} color="#D4AF37" style={{ marginBottom: 12 }} />
          <Text style={styles.messageTitle}>{profileCompleted ? 'Profile Completed' : 'Unlock Contact Details'}</Text>
          <Text style={styles.messageText}>
            {profileCompleted
              ? 'Profile done. Complete payment to unlock contact details.'
              : 'Complete your profile, then make one quick payment to unlock contact details.'}
          </Text>
        </View>

        {/* Complete Profile Button */}
        <Pressable style={styles.completeButton} onPress={() => navigation.navigate('ProfileForm' as never)}>
          <Text style={styles.completeButtonText}>{profileCompleted ? 'Edit Profile' : 'Complete Profile'}</Text>
        </Pressable>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Access</Text>

          <View style={styles.premiumCard}>
            <View style={styles.planTopRow}>
              <View style={styles.planHeader}>
              <MaterialCommunityIcons name="crown" size={28} color="#D4AF37" />
                <Text style={styles.planTitle}>One-Time Premium</Text>
              </View>
              <Text style={styles.planPrice}>$30</Text>
            </View>
            <Text style={styles.planDescription}>Lifetime access, no recurring charge.</Text>

            <View style={styles.compactBenefitsRow}>
              <View style={styles.compactBenefitPill}>
                <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.primary} />
                <Text style={styles.compactBenefitText}>Contact details</Text>
              </View>
              <View style={styles.compactBenefitPill}>
                <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.primary} />
                <Text style={styles.compactBenefitText}>Unlimited messages</Text>
              </View>
              <View style={styles.compactBenefitPill}>
                <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.primary} />
                <Text style={styles.compactBenefitText}>Priority matching</Text>
              </View>
            </View>

            <Pressable style={styles.payNowButton} onPress={handlePayment}>
              <MaterialCommunityIcons name="credit-card-check-outline" size={20} color="#fff" />
              <Text style={styles.payNowButtonText}>Pay $30 and Unlock</Text>
            </Pressable>

            <Pressable style={styles.adminHelpButton} onPress={handlePayment}>
              <MaterialCommunityIcons name="message-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.adminHelpText}>Need bank transfer help? Contact admin</Text>
            </Pressable>
          </View>
        </View>

        {/* Trust Section */}
        <View style={styles.trustSection}>
          <MaterialCommunityIcons name="shield-check" size={24} color={theme.colors.primary} />
          <Text style={styles.trustText}>Your payment is secure and encrypted</Text>
        </View>
      </ScrollView>

      <AppBottomNav activeTab="Discover" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7E1C9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2924',
    fontFamily: 'Georgia',
  },
  spacer: {
    width: 44,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  messageCard: {
    backgroundColor: '#FFF5E5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0E0D0',
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2924',
    marginBottom: 8,
    fontFamily: 'Georgia',
    textAlign: 'center',
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2924',
    marginBottom: 16,
    fontFamily: 'Georgia',
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    fontFamily: 'Georgia',
  },
  premiumCard: {
    backgroundColor: '#FFF5E5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0E0D0',
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2924',
    marginLeft: 12,
    fontFamily: 'Georgia',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D4AF37',
    fontFamily: 'Georgia',
  },
  planDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 14,
  },
  compactBenefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  compactBenefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DDD0',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 5,
  },
  compactBenefitText: {
    fontSize: 11,
    color: '#1F2924',
    fontWeight: '600',
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  payNowButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Georgia',
  },
  adminHelpButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  adminHelpText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 12,
  },
  trustText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
  },
});
