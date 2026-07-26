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
import { CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { AuthButton } from '../../components/common/AuthButton';
import { useUser } from '../../context/UserContext';
import { signInWithEmail, signUpWithEmail, resetPassword } from '../../lib/auth';
import { toSafeErrorMessage } from '../../lib/errorMessages';
import { RootStackParamList } from '../../navigation/AppNavigator';

type EmailAuthNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmailAuth'>;

const MIN_PASSWORD_LENGTH = 8;

export default function EmailAuthScreen() {
  const navigation = useNavigation<EmailAuthNavigationProp>();
  const { setIsAuthenticated, setIsGuest, setUserEmail, selectedGender } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetError(null);
    setResetSent(false);
    setShowForgotPassword(true);
  };

  // Inline state instead of Alert.alert - a multi-button Alert.alert never
  // fires on the web build (no dialog, no callback), and even a single-button
  // one is silently inert there, so this can't rely on it for feedback.
  const handleSendResetLink = async () => {
    setResetError(null);

    if (!resetEmail.trim()) {
      setResetError('Please enter the email address for your account.');
      return;
    }

    setSendingReset(true);
    const response = await resetPassword(resetEmail.trim());
    setSendingReset(false);

    if (response.success) {
      setResetSent(true);
    } else {
      setResetError(toSafeErrorMessage(response.error, 'Could not send reset link. Please try again.'));
    }
  };

  const handleContinue = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (isSignUp) {
        response = await signUpWithEmail(email, password, {
          gender_preference: selectedGender || 'male',
        });
      } else {
        response = await signInWithEmail(email, password);
      }

      if (response.success) {
        setUserEmail(email);
        setIsAuthenticated(true);
        setIsGuest(false);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs' }],
          })
        );
      } else {
        setError(toSafeErrorMessage(response.error, 'Authentication failed. Please try again.'));
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Email auth error:', (err as Error)?.message);
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
        <Text style={styles.heading}>
          {isSignUp ? 'Create Account' : 'Sign in'} with email
        </Text>
        <Text style={styles.description}>
          {isSignUp
            ? 'Create a new account to start your journey on Pashtoon Matchmaking'
            : 'Enter your email address to continue with trusted matchmaking.'}
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
            editable={!loading}
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.border}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          {isSignUp && (
            <Text style={styles.helperText}>At least {MIN_PASSWORD_LENGTH} characters</Text>
          )}
        </View>

        {!isSignUp && (
          <Pressable style={styles.forgotPasswordButton} onPress={openForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>
        )}

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

        <Text style={styles.bottomText}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Text
            style={styles.toggleLink}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </Text>
        </Text>

        <Text style={styles.privacyText}>
          We will never share your email, and your profile stays private until
          you choose to connect.
        </Text>
      </View>

      <Modal
        visible={showForgotPassword}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {resetSent ? (
              <>
                <Text style={styles.modalTitle}>Check your email</Text>
                <Text style={styles.modalSubtitle}>
                  If an account exists for {resetEmail.trim()}, a password reset link has been sent.
                </Text>
                <Pressable
                  style={styles.modalSendButton}
                  onPress={() => setShowForgotPassword(false)}
                >
                  <Text style={styles.modalSendText}>Done</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Reset your password</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your account email and we'll send you a link to reset your password.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.colors.border}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!sendingReset}
                />
                {resetError && <Text style={styles.errorText}>{resetError}</Text>}
                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setShowForgotPassword(false)}
                    disabled={sendingReset}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalSendButton, sendingReset && styles.modalSendButtonDisabled]}
                    onPress={handleSendResetLink}
                    disabled={sendingReset}
                  >
                    <Text style={styles.modalSendText}>{sendingReset ? 'Sending...' : 'Send Link'}</Text>
                  </Pressable>
                </View>
              </>
            )}
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
    marginBottom: 16,
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
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  modalSendButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  modalSendButtonDisabled: {
    opacity: 0.6,
  },
  modalSendText: {
    color: '#fff',
    fontWeight: '700',
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
  bottomText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  toggleLink: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  privacyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
