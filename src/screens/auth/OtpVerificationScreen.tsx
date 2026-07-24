import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { theme } from '../../theme';
import { AuthButton } from '../../components/common/AuthButton';
import { useUser } from '../../context/UserContext';
import { verifyOtp, signUpWithPhone } from '../../lib/auth';
import { RootStackParamList } from '../../navigation/AppNavigator';

type OtpVerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OtpVerification'>;
type OtpVerificationRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

export default function OtpVerificationScreen() {
  const navigation = useNavigation<OtpVerificationNavigationProp>();
  const route = useRoute<OtpVerificationRouteProp>();
  const { setIsAuthenticated, setIsGuest } = useUser();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);

  const phone = route.params.phone;

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const handleVerify = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyOtp(phone, otp);

      if (response.success) {
        setIsAuthenticated(true);
        setIsGuest(false);
        navigation.navigate('ProfileForm' as never);
      } else {
        setError(response.error?.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError(null);

    try {
      const response = await signUpWithPhone(phone);

      if (response.success) {
        setTimeRemaining(60);
        setOtp('');
      } else {
        setError('Failed to resend OTP');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.heading}>OTP Verification</Text>
        <Text style={styles.description}>
          Enter the 6-digit code sent to {phone}. The code will expire in{' '}
          {Math.ceil(timeRemaining / 60)} minutes.
        </Text>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor={theme.colors.border}
            keyboardType="number-pad"
            value={otp}
            onChangeText={(val) => {
              if (val.length <= 6) {
                setOtp(val);
              }
            }}
            maxLength={6}
            editable={!loading}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <AuthButton
            label={loading ? '' : 'Verify'}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading && <ActivityIndicator color="#fff" />}
          </AuthButton>
        </View>

        <View style={styles.bottomTextRow}>
          <Text style={styles.bottomText}>Didn't receive a code?</Text>
          <Pressable
            onPress={handleResend}
            disabled={resendLoading || timeRemaining > 0}
            style={{ opacity: resendLoading || timeRemaining > 0 ? 0.5 : 1 }}
          >
            <Text style={styles.resendLink}>
              {timeRemaining > 0
                ? `Resend in ${timeRemaining}s`
                : 'Resend'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 340,
  },
  inputCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  inputLabel: {
    color: theme.colors.muted,
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    fontSize: 32,
    fontWeight: '600',
    color: theme.colors.primary,
    padding: 10,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    textAlign: 'center',
    letterSpacing: 4,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  bottomTextRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  bottomText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  resendLink: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
