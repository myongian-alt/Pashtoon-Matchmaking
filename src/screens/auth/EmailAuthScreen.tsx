import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { AuthButton } from '../../components/common/AuthButton';
import { useUser } from '../../context/UserContext';

export default function EmailAuthScreen() {
  const navigation = useNavigation();
  const { setIsAuthenticated, setIsGuest, setUserEmail } = useUser();
  const [email, setEmail] = useState('');

  const handleContinue = () => {
    if (email.trim()) {
      setUserEmail(email);
      setIsAuthenticated(true);
      setIsGuest(false);
      navigation.navigate('Tabs' as never);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.heading}>Sign in with email</Text>
        <Text style={styles.description}>
          Enter your email address to receive a secure link and continue with trusted matchmaking.
        </Text>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.border}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            autoCorrect={false}
          />
        </View>

        <AuthButton label="Continue" onPress={handleContinue} />

        <Text style={styles.bottomText}>
          We will never share your email, and your profile stays private until you choose to connect.
        </Text>
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
  bottomText: {
    color: theme.colors.textSecondary,
    marginTop: 20,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 320,
  },
});
