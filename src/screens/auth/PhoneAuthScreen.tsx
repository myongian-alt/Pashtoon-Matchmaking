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
import { fonts } from '../../theme/typography';
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
// Pakistan (+92) listed first and preselected by default below, per the
// most common expected audience.
const COUNTRY_CODES = [
  { code: '+92', label: 'Pakistan' },
  { code: '+93', label: 'Afghanistan' },
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
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.emerald} />
        </Pressable>

        <Text style={styles.heading}>Login with phone</Text>
        <Text style={styles.description}>
          Enter your phone number to receive a secure code and continue with Khpalwali.
        </Text>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Phone number</Text>
          <View style={styles.phoneRow}>
            <Pressable
              style={styles.codeButton}
              onPress={() => setShowCodePicker(true)}
              disabled={loading}
            >
              <Text style={styles.codeButtonText}>{countryCode}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.emerald} />
            </Pressable>
            <TextInput
              style={styles.phoneInput}
              placeholder="300 555 0412"
              placeholderTextColor={theme.colors.faintText}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
            />
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <AuthButton
            label={loading ? '' : 'Send code'}
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
    backgroundColor: theme.colors.ivory,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: theme.colors.invitationCard,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 24,
    left: 24,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: theme.colors.ink,
    marginBottom: 12,
  },
  description: {
    fontFamily: fonts.body,
    color: theme.colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 26,
    maxWidth: 340,
  },
  inputCard: {
    backgroundColor: theme.colors.invitationCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  inputLabel: {
    color: theme.colors.mutedText,
    fontFamily: fonts.labelBold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.ivory,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: 12,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 12,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: theme.colors.inputBorder,
  },
  codeButtonText: {
    fontFamily: fonts.labelBold,
    fontSize: 15,
    color: theme.colors.emerald,
  },
  phoneInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.colors.ink,
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.invitationCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 34,
    maxHeight: '75%',
  },
  modalTitle: {
    fontFamily: fonts.labelBold,
    fontSize: 17,
    color: theme.colors.ink,
    marginBottom: 14,
  },
  codeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  codeOptionLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
  },
  codeOptionCode: {
    fontFamily: fonts.labelBold,
    fontSize: 15,
    color: theme.colors.emerald,
  },
  modalCancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    color: theme.colors.mutedText,
    fontFamily: fonts.bodyMedium,
  },
  errorText: {
    color: theme.colors.pomegranateBright,
    fontFamily: fonts.body,
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
    color: theme.colors.mutedText,
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
