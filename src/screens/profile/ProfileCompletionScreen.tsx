import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { AppBottomNav } from '../../components/common/AppBottomNav';
import { CoachTip, getProfileCoachTipsForCurrentUser } from '../../lib/aiCoach';
import { ProfileCoachCard } from '../../components/ai/ProfileCoachCard';
import { processPayment } from '../../lib/database';

export default function ProfileCompletionScreen() {
  const navigation = useNavigation();
  const { profileCompleted, userId, isGuest } = useUser();
  const [coachTips, setCoachTips] = useState<CoachTip[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTips = async () => {
      const result = await getProfileCoachTipsForCurrentUser(3);
      if (!mounted || result.error) {
        return;
      }
      setCoachTips(result.data);
    };

    loadTips();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePayment = async (method: 'card' | 'admin_contact') => {
    if (isGuest || !userId) {
      Alert.alert('Sign in required', 'Please sign in to complete your payment.');
      navigation.navigate('AuthSelection' as never);
      return;
    }

    setProcessingPayment(true);
    const result = await processPayment(userId, 30, method);
    setProcessingPayment(false);

    if (result.error) {
      Alert.alert('Payment failed', 'Could not process your payment right now. Please try again.');
      return;
    }

    navigation.navigate('PaymentSuccess' as never);
  };

  const handleSkipPayment = () => {
    (navigation as any).navigate('Tabs', { screen: 'Discover' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <Pressable style={styles.skipHeaderButton} onPress={handleSkipPayment}>
          <Text style={styles.skipHeaderText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Payment Section - leads the screen */}
        <View style={styles.premiumCard}>
          <View style={styles.recommendedBadge}>
            <MaterialCommunityIcons name="star" size={11} color="#fff" />
            <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
          </View>

          <View style={styles.planTopRow}>
            <View style={styles.planHeader}>
              <MaterialCommunityIcons name="crown" size={30} color="#D4AF37" />
              <Text style={styles.planTitle}>One-Time Premium</Text>
            </View>
            <Text style={styles.planPrice}>$30</Text>
          </View>
          <Text style={styles.planDescription}>Unlock contact details. Lifetime access, no recurring charge.</Text>

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

          <Pressable
            style={[styles.payNowButton, processingPayment && styles.payNowButtonDisabled]}
            onPress={() => handlePayment('card')}
            disabled={processingPayment}
          >
            <MaterialCommunityIcons name="credit-card-check-outline" size={22} color="#fff" />
            <Text style={styles.payNowButtonText}>
              {processingPayment ? 'Processing...' : 'Pay $30 and Unlock'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.adminHelpButton}
            onPress={() => handlePayment('admin_contact')}
            disabled={processingPayment}
          >
            <MaterialCommunityIcons name="message-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.adminHelpText}>Need bank transfer help? Contact admin</Text>
          </Pressable>

          <Pressable style={styles.skipInlineButton} onPress={handleSkipPayment} disabled={processingPayment}>
            <Text style={styles.skipInlineText}>Maybe later - skip to Discover</Text>
          </Pressable>
        </View>

        {/* Compact profile status */}
        <View style={styles.profileStatusRow}>
          <MaterialCommunityIcons
            name={profileCompleted ? 'check-circle' : 'alert-circle-outline'}
            size={18}
            color={profileCompleted ? theme.colors.success : '#D4AF37'}
          />
          <Text style={styles.profileStatusText}>
            {profileCompleted ? 'Profile completed' : 'Complete your profile for better matches'}
          </Text>
          <Pressable onPress={() => navigation.navigate('ProfileForm' as never)}>
            <Text style={styles.profileStatusLink}>{profileCompleted ? 'Edit' : 'Complete'}</Text>
          </Pressable>
        </View>

        <ProfileCoachCard
          tips={coachTips}
          onTapTip={() => navigation.navigate('ProfileForm' as never)}
        />

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
  skipHeaderButton: {
    width: 44,
    alignItems: 'flex-end',
    paddingVertical: 12,
  },
  skipHeaderText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  skipInlineButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipInlineText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  premiumCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 20,
    padding: 20,
    paddingTop: 24,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4AF37',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  recommendedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profileStatusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2924',
  },
  profileStatusLink: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
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
  payNowButtonDisabled: {
    opacity: 0.6,
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
