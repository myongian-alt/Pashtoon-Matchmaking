import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { fonts } from '../../theme/typography';
import { LinkText } from '../../components/common/LinkText';
import { signInWithGoogle } from '../../lib/auth';
import { toSafeErrorMessage } from '../../lib/errorMessages';
import { useUser } from '../../context/UserContext';

const METHODS = [
  { key: 'email', label: 'Email', icon: 'email-outline' as const, description: 'Connect with your email' },
  { key: 'google', label: 'Google', icon: 'google' as const, description: 'Continue with your Google account' },
  { key: 'phone', label: 'Phone', icon: 'phone-outline' as const, description: 'Login with phone number' },
];

export default function AuthSelectionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setIsAuthenticated, setIsGuest, setUserEmail } = useUser();
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    const response = await signInWithGoogle();
    setGoogleLoading(false);

    if (!response.success) {
      setGoogleError(toSafeErrorMessage(response.error, 'Could not sign in with Google. Please try again.'));
      return;
    }

    // Web: signInWithGoogle already kicked off a full-page redirect to
    // Google - this screen is about to unload, nothing left to do here.
    if (Platform.OS === 'web') {
      return;
    }

    // Native: the in-app browser flow already completed and a real session
    // came back.
    setIsAuthenticated(true);
    setIsGuest(false);
    setUserEmail(response.user?.email || null);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      })
    );
  };

  const handlePress = (key: string) => {
    if (key === 'email') return navigation.navigate('EmailAuth' as never);
    if (key === 'phone') return navigation.navigate('PhoneAuth' as never);
    if (key === 'google') return handleGoogleSignIn();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.emerald} />
      </Pressable>

      <Text style={styles.eyebrow}>Step 3 of 4</Text>
      <Text style={styles.title}>
        Sign in <Text style={styles.titleItalic}>or join</Text>
      </Text>
      <Text style={styles.subtitle}>We'll text a code. Your number is never shown.</Text>

      <View style={styles.methods}>
        {METHODS.map((method) => {
          const isGoogle = method.key === 'google';
          const loading = isGoogle && googleLoading;
          return (
            <Pressable
              key={method.key}
              style={({ pressed }) => [styles.methodCard, pressed && styles.methodCardPressed, loading && styles.methodCardDisabled]}
              onPress={() => handlePress(method.key)}
              disabled={loading}
            >
              <View style={[styles.methodIcon, { backgroundColor: theme.colors.emerald }]}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name={method.icon} size={22} color="#fff" />
                )}
              </View>
              <View style={styles.methodCopy}>
                <Text style={styles.methodLabel}>{method.label}</Text>
                <Text style={styles.methodDescription}>{loading ? 'Connecting...' : method.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.faintText} />
            </Pressable>
          );
        })}
      </View>

      {googleError && <Text style={styles.errorText}>{googleError}</Text>}

      <Pressable style={styles.guestLink} onPress={() => navigation.navigate('Tabs' as never)}>
        <MaterialCommunityIcons name="eye-outline" size={16} color={theme.colors.emerald} />
        <Text style={styles.guestText}>Browse as guest</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>By continuing you agree to our </Text>
        <LinkText label="Terms" onPress={() => {}} />
        <Text style={styles.footerText}> and </Text>
        <LinkText label="Privacy Policy" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ivory,
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: theme.colors.invitationCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  eyebrow: {
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.gold,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: theme.colors.ink,
    marginBottom: 8,
  },
  titleItalic: {
    fontFamily: fonts.bodyItalic,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: theme.colors.mutedText,
    marginBottom: 28,
  },
  methods: {
    gap: 12,
    marginBottom: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.invitationCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 14,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  methodCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  methodCardDisabled: {
    opacity: 0.7,
  },
  methodIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCopy: {
    flex: 1,
    gap: 2,
  },
  methodLabel: {
    fontFamily: fonts.labelBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  methodDescription: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: theme.colors.mutedText,
  },
  errorText: {
    color: theme.colors.pomegranateBright,
    fontFamily: fonts.body,
    fontSize: 13,
    marginBottom: 12,
  },
  guestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginBottom: 8,
  },
  guestText: {
    fontFamily: fonts.labelBold,
    fontSize: 14,
    color: theme.colors.emerald,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: theme.colors.mutedText,
    fontFamily: fonts.body,
    fontSize: 12.5,
  },
});
