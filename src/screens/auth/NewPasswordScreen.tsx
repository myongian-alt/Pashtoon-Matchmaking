import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { AuthButton } from '../../components/common/AuthButton';
import { useUser } from '../../context/UserContext';
import { updatePassword } from '../../lib/auth';
import { toSafeErrorMessage } from '../../lib/errorMessages';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NewPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewPassword'>;

const MIN_PASSWORD_LENGTH = 8;

export default function NewPasswordScreen() {
  const navigation = useNavigation<NewPasswordNavigationProp>();
  const { setIsAuthenticated, setIsGuest } = useUser();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (!result.success) {
      setError(toSafeErrorMessage(result.error, 'Could not update your password. Please try again.'));
      return;
    }

    setSuccess(true);
  };

  const handleContinue = () => {
    setIsAuthenticated(true);
    setIsGuest(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      })
    );
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.heading}>Password updated</Text>
          <Text style={styles.description}>
            Your password has been changed successfully. You're signed in with your new password.
          </Text>
          <View style={styles.buttonContainer}>
            <AuthButton label="Continue" onPress={handleContinue} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.heading}>Set a new password</Text>
        <Text style={styles.description}>
          Choose a new password for your account. You'll stay signed in once it's updated.
        </Text>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.border}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <Text style={styles.helperText}>At least {MIN_PASSWORD_LENGTH} characters</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.border}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <AuthButton
            label={loading ? '' : 'Update Password'}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading && <ActivityIndicator color="#fff" />}
          </AuthButton>
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
    marginTop: 8,
  },
});
