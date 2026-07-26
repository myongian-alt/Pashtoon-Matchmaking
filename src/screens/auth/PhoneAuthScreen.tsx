import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { AuthButton } from '../../components/common/AuthButton';
import { LinkText } from '../../components/common/LinkText';
import { useUser } from '../../context/UserContext';
import { signUpWithPhone } from '../../lib/auth';
import { toSafeErrorMessage } from '../../lib/errorMessages';
import { RootStackParamList } from '../../navigation/AppNavigator';

type PhoneAuthNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhoneAuth'>;

// Common calling codes for this app's likely audience (Pashtoons across
// Afghanistan/Pakistan and the diaspora) - not exhaustive, but the user can
// always type a full "+<code>" number directly and this list is skipped.
const COUNTRY_CODES = [
  { code: '+93', label: 'Afghanistan' },
  { code: '+92', label: 'Pakistan' },
  { code: '+971', label: 'United Arab Emirates' },
  { code: '+966', label: 'Saudi Arabia' },
  { code: '+974', label: 'Qatar' },
  { code: '+44', label: 'United Kingdom' },
  { code: '+1', label: 'United States / Canada' },
  { code: '+61', label: 'Australia' },
  { code: '+49', label: 'Germany' },
];

export default function PhoneAuthScreen() {
  const navigation = useNavigation<PhoneAuthNavigationProp>();
  const { setUserPhone, selectedGender } = useUser();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [showCodePicker, setShowCodePicker] = useState(false);
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
      const cleanedPhone = phone.replace(/[\s()-]/g, '');
      const formattedPhone = cleanedPhone.startsWith('+')
        ? cleanedPhone
        : `${countryCode}${cleanedPhone.replace(/^0+/, '')}`;

      const response = await signUpWithPhone(formattedPhone);

      if (response.success) {
        setUserPhone(formattedPhone);
        navigation.navigate('OtpVerification', {
          phone: formattedPhone,
          gender: selectedGender || undefined,
        });
      } else {
        const rawMessage = (response.error?.message || '').toLowerCase();

        if (rawMessage.includes('unsupported phone provider')) {
          setError(
            'Phone login is not enabled for this Supabase project yet. Please configure an SMS provider in Supabase Auth > Providers.'
          );
        } else {
          setError(toSafeErrorMessage(response.error, 'Failed to send OTP. Please try again.'));
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Phone auth error:', (err as Error)?.message);
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
          <View style={styles.phoneRow}>
            <Pressable
              style={styles.codeButton}
              onPress={() => setShowCodePicker(true)}
              disabled={loading}
            >
              <Text style={styles.codeButtonText}>{countryCode}</Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.primary} />
            </Pressable>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="300 1234567"
              placeholderTextColor={theme.colors.border}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
            />
          </View>
          <Text style={styles.helperText}>
            Select your country code, or type a full number starting with "+".
          </Text>
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

      <Modal
        visible={showCodePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCodePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select country code</Text>
            {COUNTRY_CODES.map((item) => (
              <Pressable
                key={item.code}
                style={styles.codeOption}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCodePicker(false);
                }}
              >
                <Text style={styles.codeOptionLabel}>{item.label}</Text>
                <Text style={styles.codeOptionCode}>{item.code}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.modalCancel} onPress={() => setShowCodePicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  codeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 34,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 14,
  },
  codeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  codeOptionLabel: {
    fontSize: 15,
    color: theme.colors.text,
  },
  codeOptionCode: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  modalCancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
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
  providerHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
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
