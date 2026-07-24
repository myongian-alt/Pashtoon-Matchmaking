import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

export default function ProfileCompletionScreen() {
  const navigation = useNavigation();

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
          <Text style={styles.messageTitle}>Unlock Contact Details</Text>
          <Text style={styles.messageText}>
            To view contact information, complete your profile and proceed with payment.
          </Text>
        </View>

        {/* Complete Profile Button */}
        <Pressable style={styles.completeButton} onPress={() => navigation.navigate('ProfileForm' as never)}>
          <Text style={styles.completeButtonText}>Complete Profile</Text>
        </Pressable>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Membership</Text>
          
          <View style={styles.premiumCard}>
            <View style={styles.planHeader}>
              <MaterialCommunityIcons name="crown" size={28} color="#D4AF37" />
              <Text style={styles.planTitle}>One-Time Premium</Text>
            </View>
            <Text style={styles.planPrice}>$30 USD</Text>
            <Text style={styles.planDescription}>
              Lifetime access to all premium features
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
                <Text style={styles.featureText}>View all contact details</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
                <Text style={styles.featureText}>Unlimited messages</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
                <Text style={styles.featureText}>Priority matching</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
                <Text style={styles.featureText}>Video call support</Text>
              </View>
            </View>
          </View>

          <View style={styles.paymentOptionsContainer}>
            <Text style={styles.paymentOptionsTitle}>Payment Methods</Text>
            
            <Pressable style={styles.paymentOption} onPress={handlePayment}>
              <MaterialCommunityIcons name="credit-card" size={20} color={theme.colors.primary} />
              <Text style={styles.paymentOptionText}>Pay Online (Card)</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </Pressable>

            <Pressable style={styles.paymentOption} onPress={handlePayment}>
              <MaterialCommunityIcons name="bank-transfer" size={20} color={theme.colors.primary} />
              <Text style={styles.paymentOptionText}>Bank Transfer</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </Pressable>

            <Pressable style={styles.paymentOption} onPress={handlePayment}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
              <Text style={styles.paymentOptionText}>Contact Admin</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </Pressable>
          </View>
        </View>

        {/* Trust Section */}
        <View style={styles.trustSection}>
          <MaterialCommunityIcons name="shield-check" size={24} color={theme.colors.primary} />
          <Text style={styles.trustText}>Your payment is secure and encrypted</Text>
        </View>
      </ScrollView>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0E0D0',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2924',
    marginLeft: 12,
    fontFamily: 'Georgia',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D4AF37',
    marginBottom: 8,
    fontFamily: 'Georgia',
  },
  planDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#1F2924',
    fontWeight: '600',
    marginLeft: 10,
  },
  paymentOptionsContainer: {
    marginBottom: 16,
  },
  paymentOptionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2924',
    marginBottom: 12,
    fontFamily: 'Georgia',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2924',
    marginLeft: 12,
    fontFamily: 'Georgia',
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
