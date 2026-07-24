import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { useUser } from '../../context/UserContext';
import { signInWithEmail, signUpWithEmail } from '../../lib/auth';
import { RootStackParamList } from '../../navigation/AppNavigator';

type EmailAuthNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmailAuth'>;

export default function EmailAuthScreen() {
  const navigation = useNavigation<EmailAuthNavigationProp>();
  const { setIsAuthenticated, setIsGuest, setUserEmail, selectedGender } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
        navigation.navigate('ProfileForm' as never);
      } else {
        setError(response.error?.message || 'Authentication failed');
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
            <Text style={styles.helperText}>At least 6 characters</Text>
          )}
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
