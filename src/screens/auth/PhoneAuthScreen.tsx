import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { AuthButton } from '../../components/common/AuthButton';
import { LinkText } from '../../components/common/LinkText';
import { useUser } from '../../context/UserContext';
import { signUpWithPhone } from '../../lib/auth';
import { RootStackParamList } from '../../navigation/AppNavigator';

type PhoneAuthNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhoneAuth'>;

export default function PhoneAuthScreen() {
  const navigation = useNavigation<PhoneAuthNavigationProp>();
  const { setUserPhone, selectedGender } = useUser();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : '+92' + phone;

      const response = await signUpWithPhone(formattedPhone);

      if (response.success) {
        setUserPhone(formattedPhone);
        navigation.navigate('OtpVerification', {
          phone: formattedPhone,
          gender: selectedGender || undefined,
        });
      } else {
        setError(response.error?.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.heading}>Login with phone</Text>
        <Text style={styles.description}>
          Enter your phone number to receive a secure OTP and continue with
          Pashtoon Matchmaking.
        </Text>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+92 300 1234567"
            placeholderTextColor={theme.colors.border}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />
          <Text style={styles.helperText}>Include country code (e.g., +92)</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <AuthButton
            label={loading ? '' : 'Continue'}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading && <ActivityIndicator color="#fff" />}
          </AuthButton>
        </View>

        <View style={styles.bottomTextRow}>
          <Text style={styles.bottomText}>Need help?</Text>
          <LinkText label="Contact Support" onPress={() => {}} />
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
    fontSize: 16,
    color: theme.colors.text,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 8,
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
    gap: 8,
  },
  bottomText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
