import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';

export default function PaymentSuccessScreen() {
  const navigation = useNavigation();
  const { setPaymentCompleted } = useUser();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 1.2,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    setPaymentCompleted(true);
  }, [scaleAnim, fadeAnim, setPaymentCompleted]);

  const handleContinue = () => {
    navigation.navigate('Tabs' as never);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={[styles.successContainer, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
          <View style={styles.checkmarkCircle}>
            <MaterialCommunityIcons name="check" size={60} color="#fff" />
          </View>

          <Text style={styles.successTitle}>Payment Successful!</Text>

          <View style={styles.messageBox}>
            <MaterialCommunityIcons name="information-outline" size={24} color={theme.colors.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.messageTitle}>What's Next?</Text>
            <Text style={styles.messageText}>
              Thank you for completing your payment. Our admin team will review your profile and contact you soon with matched profiles and opportunities to connect.
            </Text>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Typical Response Time</Text>
                <Text style={styles.detailValue}>24-48 hours</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Admin Contact</Text>
                <Text style={styles.detailValue}>Via phone or email</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="shield-check" size={20} color={theme.colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Your Profile</Text>
                <Text style={styles.detailValue}>Now unlocked for matches</Text>
              </View>
            </View>
          </View>

          <View style={styles.benefitsBox}>
            <Text style={styles.benefitsTitle}>You now have access to:</Text>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
              <Text style={styles.benefitText}>View contact details of matched profiles</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Send unlimited messages</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Priority matching algorithm</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Video call support</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue to Home</Text>
          </Pressable>

          <Text style={styles.footerNote}>
            Keep your contact information updated so our team can reach you easily.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7E1C9',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  successContainer: {
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Georgia',
  },
  messageBox: {
    backgroundColor: '#FFF5E5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E0D0',
    alignItems: 'center',
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2924',
    marginBottom: 12,
    fontFamily: 'Georgia',
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2924',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8DDD0',
    marginVertical: 16,
  },
  benefitsBox: {
    backgroundColor: '#F5FBF7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D5E6DB',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2924',
    marginBottom: 16,
    fontFamily: 'Georgia',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 0.14,
    shadowRadius: 21,
    elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Georgia',
  },
  footerNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
