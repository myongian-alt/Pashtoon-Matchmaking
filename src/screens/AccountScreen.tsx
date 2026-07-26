import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { useForm } from '../context/FormContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ModernMuslimAvatar } from '../components/common/ModernMuslimAvatar';
import { LinkText } from '../components/common/LinkText';
import { buildSelfProfileFromForm } from '../lib/selfProfile';
import { signOut, updateEmail, updatePhone } from '../lib/auth';
import {
  getSubscriptionStatus,
  getPaymentHistory,
  getProfileVerificationStatus,
  getUserPreferences,
  upsertUserPreferences,
  getAccountSettings,
  setNotificationsEnabled,
  deactivateAccount,
  requestProfileVerification,
} from '../lib/database';

type AccountNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GENDER_SEEKING_OPTIONS = ['male', 'female', 'both', 'any'] as const;

function genderSeekingLabel(option: (typeof GENDER_SEEKING_OPTIONS)[number]) {
  if (option === 'both') return 'Both';
  if (option === 'any') return 'Any';
  return option.charAt(0).toUpperCase() + option.slice(1);
}

export default function AccountScreen() {
  const navigation = useNavigation<AccountNavigationProp>();
  const { isGuest, userId, userEmail, userPhone, selectedGender } = useUser();
  const { formData, calculateProfileStrength } = useForm();

  const [loadingData, setLoadingData] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

  const [genderSeeking, setGenderSeeking] = useState<(typeof GENDER_SEEKING_OPTIONS)[number]>('any');
  const [ageMin, setAgeMin] = useState('18');
  const [ageMax, setAgeMax] = useState('60');
  const [preferredCitiesText, setPreferredCitiesText] = useState('');
  const [showProfileToAll, setShowProfileToAll] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [editField, setEditField] = useState<'email' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingEditField, setSavingEditField] = useState(false);

  const [signingOut, setSigningOut] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);

  useEffect(() => {
    if (isGuest || !userId) {
      setLoadingData(false);
      return;
    }

    let isMounted = true;

    (async () => {
      setLoadingData(true);

      const [subResult, paymentsResult, verificationResult, prefsResult, settingsResult] = await Promise.all([
        getSubscriptionStatus(userId),
        getPaymentHistory(userId),
        getProfileVerificationStatus(userId),
        getUserPreferences(userId),
        getAccountSettings(userId),
      ]);

      if (!isMounted) {
        return;
      }

      setSubscription(subResult.data);
      setPayments(paymentsResult.data || []);
      setVerification(verificationResult.data);

      if (prefsResult.data) {
        setGenderSeeking(prefsResult.data.gender_seeking || 'any');
        setAgeMin(String(prefsResult.data.age_min ?? 18));
        setAgeMax(String(prefsResult.data.age_max ?? 60));
        setPreferredCitiesText((prefsResult.data.preferred_cities || []).join(', '));
        setShowProfileToAll(prefsResult.data.show_profile_to_all ?? true);
      }

      if (settingsResult.data) {
        setNotificationsEnabledState(settingsResult.data.notifications_enabled ?? true);
      }

      setLoadingData(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [isGuest, userId]);

  const handleViewMyProfile = () => {
    navigation.navigate('ProfileDetail', { profile: buildSelfProfileFromForm(formData, selectedGender) });
  };

  const handleSavePreferences = async () => {
    if (!userId) return;

    const min = Number(ageMin);
    const max = Number(ageMax);

    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
      Alert.alert('Invalid age range', 'Please enter valid numbers for the age range.');
      return;
    }

    if (min >= max) {
      Alert.alert('Invalid age range', 'Minimum age must be less than maximum age.');
      return;
    }

    setSavingPreferences(true);
    const preferredCities = preferredCitiesText
      .split(',')
      .map((city) => city.trim())
      .filter(Boolean);

    const result = await upsertUserPreferences(userId, {
      gender_seeking: genderSeeking,
      age_min: min,
      age_max: max,
      preferred_cities: preferredCities,
      show_profile_to_all: showProfileToAll,
    });
    setSavingPreferences(false);

    if (result.error) {
      Alert.alert('Could not save preferences', 'Please try again.');
      return;
    }

    Alert.alert('Saved', 'Your discovery preferences have been updated.');
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabledState(value);
    const result = await setNotificationsEnabled(value);
    if (result.error) {
      setNotificationsEnabledState(!value);
      Alert.alert('Could not update', 'Please try again.');
    }
  };

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    const result = await requestProfileVerification();
    setRequestingVerification(false);

    if (result.error) {
      Alert.alert('Could not submit request', 'Please try again.');
      return;
    }

    setVerification(result.data);
    Alert.alert('Request submitted', "We'll review your profile and notify you once it's verified.");
  };

  const openEditField = (field: 'email' | 'phone') => {
    setEditField(field);
    setEditValue((field === 'email' ? userEmail : userPhone) || '');
  };

  const handleSaveEditField = async () => {
    if (!editField || !editValue.trim()) {
      return;
    }

    setSavingEditField(true);
    const result = editField === 'email' ? await updateEmail(editValue.trim()) : await updatePhone(editValue.trim());
    setSavingEditField(false);

    if (!result.success) {
      Alert.alert('Could not update', result.error?.message || 'Please try again.');
      return;
    }

    setEditField(null);
    Alert.alert(
      'Confirmation required',
      `Check your ${editField === 'email' ? 'inbox' : 'phone'} to confirm this change before it takes effect.`
    );
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'AuthSelection' }] }));
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate account',
      'Your profile will be hidden from discovery and you will be signed out. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            const result = await deactivateAccount(userId);
            if (result.error) {
              Alert.alert('Could not deactivate', 'Please try again.');
              return;
            }
            await handleSignOut();
          },
        },
      ]
    );
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
        </View>
        <View style={styles.guestCard}>
          <MaterialCommunityIcons name="account-circle-outline" size={56} color={theme.colors.primary} />
          <Text style={styles.guestTitle}>You're browsing as a guest</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to manage your profile, subscription, and account settings.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('EmailAuth')}>
            <Text style={styles.primaryButtonText}>Sign In with Email</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => navigation.navigate('PhoneAuth')}>
            <Text style={styles.outlineButtonText}>Sign In with Phone</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hasUploadedPhoto =
    typeof formData.profilePhoto === 'string' &&
    (formData.profilePhoto.startsWith('http') || formData.profilePhoto.startsWith('file:'));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      {loadingData ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile preview */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              {hasUploadedPhoto ? (
                <Image source={{ uri: formData.profilePhoto }} style={styles.avatarImage} />
              ) : (
                <ModernMuslimAvatar gender={selectedGender === 'female' ? 'female' : 'male'} size={84} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{formData.name || 'Your Profile'}</Text>
              <Text style={styles.profileMeta}>{userEmail || userPhone || 'No contact on file'}</Text>
              <View style={styles.badgeRow}>
                <View style={verification?.is_verified ? styles.verifiedBadge : styles.unverifiedBadge}>
                  {verification?.is_verified && (
                    <MaterialCommunityIcons name="check-decagram" size={12} color="#fff" />
                  )}
                  <Text style={verification?.is_verified ? styles.verifiedBadgeText : styles.unverifiedBadgeText}>
                    {verification?.is_verified ? 'Verified' : 'Not verified'}
                  </Text>
                </View>
                <Text style={styles.strengthText}>{calculateProfileStrength()}% complete</Text>
              </View>
            </View>
          </View>

          <View style={styles.rowButtons}>
            <Pressable style={[styles.outlineButton, styles.rowButton]} onPress={handleViewMyProfile}>
              <Text style={styles.outlineButtonText}>View Profile</Text>
            </Pressable>
            <Pressable style={[styles.outlineButton, styles.rowButton]} onPress={() => navigation.navigate('ProfileForm')}>
              <Text style={styles.outlineButtonText}>Edit Profile</Text>
            </Pressable>
          </View>

          {/* Subscription */}
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.card}>
            {subscription ? (
              <>
                <View style={styles.subRow}>
                  <MaterialCommunityIcons name="crown" size={22} color="#D4AF37" />
                  <Text style={styles.subStatus}>Premium active</Text>
                </View>
                <Text style={styles.subDetail}>
                  Expires {new Date(subscription.expires_at).toLocaleDateString()}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.subStatus}>No active subscription</Text>
                <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Premium')}>
                  <Text style={styles.primaryButtonText}>Upgrade to Premium</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Payment history */}
          <Text style={styles.sectionTitle}>Payment History</Text>
          <View style={styles.card}>
            {payments.length === 0 ? (
              <Text style={styles.emptyText}>No payments yet.</Text>
            ) : (
              payments.slice(0, 10).map((payment) => (
                <View key={payment.id} style={styles.paymentRow}>
                  <View>
                    <Text style={styles.paymentAmount}>${Number(payment.amount_usd).toFixed(2)}</Text>
                    <Text style={styles.paymentMeta}>
                      {new Date(payment.created_at).toLocaleDateString()} · {payment.payment_method}
                    </Text>
                  </View>
                  <Text style={styles.paymentStatus}>{payment.status}</Text>
                </View>
              ))
            )}
          </View>

          {/* Verification */}
          <Text style={styles.sectionTitle}>Verification</Text>
          <View style={styles.card}>
            <Text style={styles.verificationText}>
              {verification?.is_verified
                ? 'Your profile is verified.'
                : verification?.verification_requested_at
                ? "Verification requested — we'll notify you once it's reviewed."
                : 'Get a verified badge on your profile to build trust with other members.'}
            </Text>
            {!verification?.is_verified && !verification?.verification_requested_at ? (
              <Pressable
                style={[styles.primaryButton, requestingVerification && styles.primaryButtonDisabled]}
                onPress={handleRequestVerification}
                disabled={requestingVerification}
              >
                {requestingVerification ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Request Verification</Text>
                )}
              </Pressable>
            ) : null}
          </View>

          {/* Discovery preferences */}
          <Text style={styles.sectionTitle}>Discovery Preferences</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Show me</Text>
            <View style={styles.chipRow}>
              {GENDER_SEEKING_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.chip, genderSeeking === option && styles.chipActive]}
                  onPress={() => setGenderSeeking(option)}
                >
                  <Text style={[styles.chipText, genderSeeking === option && styles.chipTextActive]}>
                    {genderSeekingLabel(option)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Age range</Text>
            <View style={styles.ageRow}>
              <TextInput
                style={styles.ageInput}
                keyboardType="number-pad"
                value={ageMin}
                onChangeText={setAgeMin}
                placeholder="Min"
                placeholderTextColor={theme.colors.border}
              />
              <Text style={styles.ageSeparator}>–</Text>
              <TextInput
                style={styles.ageInput}
                keyboardType="number-pad"
                value={ageMax}
                onChangeText={setAgeMax}
                placeholder="Max"
                placeholderTextColor={theme.colors.border}
              />
            </View>

            <Text style={styles.fieldLabel}>Preferred cities</Text>
            <TextInput
              style={styles.textInput}
              value={preferredCitiesText}
              onChangeText={setPreferredCitiesText}
              placeholder="e.g. Kabul, Peshawar, Dubai"
              placeholderTextColor={theme.colors.border}
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Show my profile to everyone</Text>
              <Switch
                value={showProfileToAll}
                onValueChange={setShowProfileToAll}
                trackColor={{ true: theme.colors.primary }}
              />
            </View>

            <Pressable style={styles.primaryButton} onPress={handleSavePreferences} disabled={savingPreferences}>
              <Text style={styles.primaryButtonText}>{savingPreferences ? 'Saving...' : 'Save Preferences'}</Text>
            </Pressable>
          </View>

          {/* Account settings */}
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.card}>
            <Pressable style={styles.settingRow} onPress={() => openEditField('email')}>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>{userEmail || 'Add email'}</Text>
            </Pressable>
            <Pressable style={styles.settingRow} onPress={() => openEditField('phone')}>
              <Text style={styles.settingLabel}>Phone</Text>
              <Text style={styles.settingValue}>{userPhone || 'Add phone'}</Text>
            </Pressable>
            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ true: theme.colors.primary }}
              />
            </View>
            <Pressable style={styles.dangerButton} onPress={handleDeactivateAccount}>
              <Text style={styles.dangerButtonText}>Deactivate Account</Text>
            </Pressable>
          </View>

          {/* Support & legal */}
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <View style={styles.card}>
            <LinkText label="Contact Support" onPress={() => {}} style={styles.linkRow} />
            <LinkText label="Privacy Policy" onPress={() => {}} style={styles.linkRow} />
            <LinkText label="Terms of Service" onPress={() => {}} style={styles.linkRow} />
          </View>

          <Pressable style={styles.signOutButton} onPress={handleSignOut} disabled={signingOut}>
            <MaterialCommunityIcons name="logout" size={20} color={theme.colors.danger} />
            <Text style={styles.signOutText}>{signingOut ? 'Signing out...' : 'Sign Out'}</Text>
          </Pressable>
        </ScrollView>
      )}

      <Modal visible={editField !== null} transparent animationType="slide" onRequestClose={() => setEditField(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editField === 'email' ? 'Change Email' : 'Change Phone'}</Text>
            <TextInput
              style={styles.textInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={editField === 'email' ? 'you@example.com' : '+92 300 1234567'}
              placeholderTextColor={theme.colors.border}
              keyboardType={editField === 'email' ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.outlineButton, styles.rowButton]} onPress={() => setEditField(null)}>
                <Text style={styles.outlineButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.rowButton]}
                onPress={handleSaveEditField}
                disabled={savingEditField}
              >
                <Text style={styles.primaryButtonText}>{savingEditField ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  guestCard: {
    marginHorizontal: 20,
    marginTop: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  guestTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: theme.colors.surfaceSoft,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  verifiedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  unverifiedBadge: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  unverifiedBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  strengthText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  rowButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subDetail: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  paymentMeta: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  verificationText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSoft,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ageInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: theme.colors.text,
  },
  ageSeparator: {
    color: theme.colors.textSecondary,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: theme.colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  settingValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  dangerButton: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  dangerButtonText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  linkRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  signOutText: {
    color: theme.colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  outlineButton: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  outlineButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 15,
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
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});
