import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { AuthButton } from '../../components/common/AuthButton';
import { LinkText } from '../../components/common/LinkText';
import { useUser } from '../../context/UserContext';

export default function PhoneAuthScreen() {
  const navigation = useNavigation();
  const { setUserPhone } = useUser();
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    if (phone.trim()) {
      setUserPhone(phone);
      navigation.navigate('OtpVerification' as never);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.heading}>Login with phone</Text>
        <Text style={styles.description}>Enter your phone number to receive a secure OTP and continue with Khpalwali.</Text>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+92 300 1234567"
            placeholderTextColor={theme.colors.border}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <AuthButton label="Continue" onPress={handleContinue} />

        <View style={styles.bottomTextRow}>
          <Text style={styles.bottomText}>Forgot password?</Text>
          <LinkText label="Reset" onPress={() => {}} />
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
    paddingVertical: 12,
  },
  bottomTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  bottomText: {
    color: theme.colors.textSecondary,
    marginRight: 6,
  },
});
