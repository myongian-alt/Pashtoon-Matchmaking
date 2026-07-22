import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { AuthButton } from '../../components/common/AuthButton';
import { LinkText } from '../../components/common/LinkText';

export default function OtpVerificationScreen() {
  const navigation = useNavigation();
  const [otp, setOtp] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.heading}>OTP Verification</Text>
        <Text style={styles.description}>Enter the OTP sent to your phone number to verify your account.</Text>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={theme.colors.border}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
          />
        </View>

        <AuthButton label="Verify" onPress={() => navigation.navigate('ProfileCompletion' as never)} />

        <View style={styles.bottomTextRow}>
          <Text style={styles.bottomText}>Didn't receive a code?</Text>
          <LinkText label="Resend" onPress={() => {}} />
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
