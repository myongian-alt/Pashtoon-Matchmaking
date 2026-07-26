import React, { useState, useEffect } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { LoginPromptModal } from '../components/common/LoginPromptModal';
import { ModernMuslimAvatar } from '../components/common/ModernMuslimAvatar';
import { AppBottomNav } from '../components/common/AppBottomNav';
import {
  sendConnectionRequest,
  blockUser,
  submitReport,
  ReportType,
  trackProfileView,
  isUserPremium,
  getOrCreateConversation,
} from '../lib/database';

const REPORT_TYPES: { key: ReportType; label: string }[] = [
  { key: 'fake_profile', label: 'Fake profile' },
  { key: 'inappropriate_content', label: 'Inappropriate content' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'scam', label: 'Scam' },
  { key: 'catfish', label: 'Catfish' },
  { key: 'other', label: 'Other' },
];

export function ProfileDetailScreen({ route, navigation }: any) {
  const profile = route.params?.profile;
  const { isGuest, paymentCompleted, userId } = useUser();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('fake_profile');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const isSelfProfile = Boolean(profile?.isSelfProfile);
  const galleryPhotos = Array.isArray(profile?.galleryPhotos)
    ? profile.galleryPhotos.filter((uri: unknown) => typeof uri === 'string' && uri.length > 0)
    : [];
  const isPresetAvatar = profile?.image === 'male-avatar' || profile?.image === 'female-avatar';
  const profileImageSource =
    typeof profile?.image === 'string' && profile.image.length > 0 && !isPresetAvatar
      ? { uri: profile.image }
      : profile?.image;

  // Check if guest is trying to view profile detail
  useEffect(() => {
    if (isGuest && !isSelfProfile) {
      setShowLoginPrompt(true);
    }
  }, [isGuest, isSelfProfile]);

  useEffect(() => {
    if (!isGuest && !isSelfProfile && profile?.userId) {
      trackProfileView(profile.userId);
    }
  }, [isGuest, isSelfProfile, profile?.userId]);

  useEffect(() => {
    if (isGuest || !userId) {
      setIsPremium(false);
      return;
    }

    let isMounted = true;
    isUserPremium(userId).then((result) => {
      if (isMounted) {
        setIsPremium(result.isPremium);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isGuest, userId]);

  const handleLoginWithEmail = () => {
    setShowLoginPrompt(false);
    navigation.navigate('EmailAuth' as never);
  };

  const handleLoginWithPhone = () => {
    setShowLoginPrompt(false);
    navigation.navigate('PhoneAuth' as never);
  };

  const handleDismiss = () => {
    setShowLoginPrompt(false);
    navigation.goBack();
  };

  const handleEditMyProfile = () => {
    navigation.navigate('ProfileForm' as never);
  };

  const handleSendInterest = async () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    if (!profile?.userId) {
      Alert.alert('Not available', 'This demo profile is not connected to a real account yet.');
      return;
    }

    setSendingInterest(true);
    const result = await sendConnectionRequest(profile.userId);
    setSendingInterest(false);

    if (result.error) {
      const message =
        typeof result.error === 'string' ? result.error : (result.error as any)?.message || '';
      if (message.includes('23505') || message.toLowerCase().includes('duplicate')) {
        Alert.alert('Already sent', 'You already sent an interest request to this profile.');
      } else {
        Alert.alert('Could not send interest', 'Please try again.');
      }
      return;
    }

    setInterestSent(true);
    Alert.alert('Interest sent', 'Your interest has been sent successfully.');
  };

  const handleSendMessage = async () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    if (!profile?.userId) {
      Alert.alert('Not available', 'This demo profile is not connected to a real account yet.');
      return;
    }

    if (!isPremium) {
      // Multi-button Alert.alert doesn't fire on the web build (react-native-web
      // limitation - confirmed no dialog and no callback ever runs there), so
      // this has to navigate directly rather than depend on an "Upgrade" button
      // inside a confirm dialog.
      navigation.navigate('Premium' as never);
      return;
    }

    if (!userId) {
      return;
    }

    setSendingMessage(true);
    const result = await getOrCreateConversation(userId, profile.userId);
    setSendingMessage(false);

    if (result.error || !result.data) {
      Alert.alert('Could not start conversation', 'Please try again.');
      return;
    }

    navigation.navigate('Chat', {
      conversationId: result.data.id,
      counterpartName: profile.name,
      counterpartUserId: profile.userId,
    });
  };

  // A confirm-style Alert.alert (Cancel/Block buttons with an onPress
  // callback) never fires on the web build - no dialog, no callback, the
  // button just does nothing - so this needs a real in-app modal instead.
  const handleBlock = () => {
    if (!profile?.userId) {
      Alert.alert('Not available', 'This demo profile is not connected to a real account yet.');
      return;
    }

    setShowBlockConfirm(true);
  };

  const handleConfirmBlock = async () => {
    if (!profile?.userId) {
      return;
    }

    setBlocking(true);
    const result = await blockUser(profile.userId);
    setBlocking(false);

    if (result.error) {
      Alert.alert('Could not block', 'Please try again.');
      return;
    }

    setShowBlockConfirm(false);
    navigation.goBack();
  };

  const handleSubmitReport = async () => {
    if (!profile?.userId) {
      Alert.alert('Not available', 'This demo profile is not connected to a real account yet.');
      return;
    }

    if (!reportDescription.trim()) {
      Alert.alert('Add a few details', 'Please describe what happened before submitting.');
      return;
    }

    setSubmittingReport(true);
    const result = await submitReport(profile.userId, reportType, reportDescription.trim());
    setSubmittingReport(false);

    if (result.error) {
      Alert.alert('Could not submit report', 'Please try again.');
      return;
    }

    setShowReportModal(false);
    setReportDescription('');
    Alert.alert('Report submitted', 'Thank you - our team will review this.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Image with Gender Badge */}
        <View style={styles.imageContainer}>
          <View style={styles.imageFrame}>
            {profileImageSource ? (
              <Image source={profileImageSource} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.emptyImage]}>
                <ModernMuslimAvatar gender={profile?.gender === 'female' ? 'female' : 'male'} size={90} />
              </View>
            )}
            <View style={styles.genderBadge}>
              {profile.gender === 'male' ? (
                <MaterialCommunityIcons name="human-male" size={18} color="#fff" />
              ) : (
                <MaterialCommunityIcons name="human-female" size={18} color="#fff" />
              )}
            </View>
          </View>
        </View>

        {/* Header Info with Marital Status */}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{profile?.name || 'Your Profile'}</Text>
          <Text style={styles.subtitle}>{profile?.age ? `${profile.age} years old` : 'Age not provided'}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="ring" size={20} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Marital Status</Text>
            <Text style={styles.infoValue}>{profile?.maritalStatus || 'Not set'}</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Current City</Text>
            <Text style={styles.infoValue}>{profile?.currentCity || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="home-map-marker" size={20} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>City of Birth</Text>
            <Text style={styles.infoValue}>{profile?.cityOfBirth || 'Not set'}</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="human-male-height" size={20} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoValue}>{profile?.height || 'Not set'}</Text>
          </View>
        </View>

        {/* About Me Section */}
        {profile?.aboutMe ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>About Me</Text>
            </View>
            <Text style={styles.aboutText}>{profile.aboutMe}</Text>
          </View>
        ) : null}

        {/* Physical Characteristics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="human-male-board" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Physical</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Body Type</Text>
              <Text style={styles.detailValue}>{profile?.bodyType || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Education & Career */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="briefcase" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Education & Career</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Education</Text>
              <Text style={styles.detailValue}>{profile?.education || 'Not set'}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Profession</Text>
              <Text style={styles.detailValue}>{profile?.profession || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Lifestyle */}
        {profile?.lifestyle ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Lifestyle</Text>
            </View>
            <Text style={styles.detailText}>{profile.lifestyle}</Text>
          </View>
        ) : null}

        {/* Moral & Values */}
        {profile?.values ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="scale-balance" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Values & Morals</Text>
            </View>
            <Text style={styles.detailText}>{profile.values}</Text>
          </View>
        ) : null}

        {/* Family */}
        {profile?.personality ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="family-tree" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Personality</Text>
            </View>
            <Text style={styles.detailText}>{profile.personality}</Text>
          </View>
        ) : null}

        {/* Gallery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="image-multiple" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Gallery</Text>
          </View>
          <View style={styles.galleryRow}>
            {galleryPhotos.length > 0 ? (
              galleryPhotos.slice(0, 3).map((photo: string, index: number) => (
                <View key={index} style={styles.galleryPlaceholder}>
                  <Image source={{ uri: photo }} style={styles.galleryImage} />
                </View>
              ))
            ) : (
              <View style={[styles.galleryPlaceholder, styles.galleryPlaceholderWide]}>
                <MaterialCommunityIcons name="image-plus" size={32} color={theme.colors.primary} />
                <Text style={styles.galleryText}>No gallery photos yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Details Button */}
        {!isSelfProfile ? (
          <Pressable
            style={styles.contactButton}
            onPress={() => navigation.navigate('ProfileCompletion' as never)}
          >
            <MaterialCommunityIcons name="lock-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.contactButtonLabel}>View Contact Details</Text>
          </Pressable>
        ) : null}

        {/* Send Message Button */}
        {!isSelfProfile ? (
          <Pressable
            style={[styles.actionButton, styles.messageButton, sendingMessage && styles.actionButtonDisabled]}
            onPress={handleSendMessage}
            disabled={sendingMessage}
          >
            <MaterialCommunityIcons
              name={isPremium ? 'chat-outline' : 'lock-outline'}
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.actionLabel}>
              {sendingMessage ? 'Opening chat...' : isPremium ? 'Send a Message' : 'Send a Message (Premium)'}
            </Text>
          </Pressable>
        ) : null}

        {/* Send Interest Button */}
        {!isSelfProfile ? (
          <Pressable
            style={[styles.actionButton, (sendingInterest || interestSent) && styles.actionButtonDisabled]}
            onPress={handleSendInterest}
            disabled={sendingInterest || interestSent}
          >
            <MaterialCommunityIcons name="heart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionLabel}>
              {interestSent ? 'Interest Sent' : sendingInterest ? 'Sending...' : 'Send Interest'}
            </Text>
          </Pressable>
        ) : null}

        {isSelfProfile ? (
          <Pressable style={styles.actionButton} onPress={handleEditMyProfile}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionLabel}>Edit My Profile</Text>
          </Pressable>
        ) : null}

        {!isSelfProfile && !isGuest ? (
          <View style={styles.safetyRow}>
            <Pressable style={styles.safetyButton} onPress={() => setShowReportModal(true)}>
              <MaterialCommunityIcons name="flag-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.safetyButtonText}>Report</Text>
            </Pressable>
            <Pressable style={styles.safetyButton} onPress={handleBlock}>
              <MaterialCommunityIcons name="account-cancel-outline" size={16} color={theme.colors.danger} />
              <Text style={[styles.safetyButtonText, { color: theme.colors.danger }]}>Block</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <AppBottomNav activeTab="Discover" />

      {/* Login Prompt Modal for Guests */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onLoginWithEmail={handleLoginWithEmail}
        onLoginWithPhone={handleLoginWithPhone}
        onDismiss={handleDismiss}
      />

      {/* Block Confirm Modal */}
      <Modal visible={showBlockConfirm} transparent animationType="fade" onRequestClose={() => setShowBlockConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Block this profile?</Text>
            <Text style={styles.blockConfirmText}>
              You won't see {profile?.name || 'this profile'} again, and they won't see yours.
            </Text>
            <View style={styles.blockConfirmActions}>
              <Pressable
                style={styles.blockConfirmCancelButton}
                onPress={() => setShowBlockConfirm(false)}
                disabled={blocking}
              >
                <Text style={styles.blockConfirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.blockConfirmBlockButton, blocking && styles.actionButtonDisabled]}
                onPress={handleConfirmBlock}
                disabled={blocking}
              >
                <Text style={styles.blockConfirmBlockText}>{blocking ? 'Blocking...' : 'Block'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Report this profile</Text>

            <View style={styles.reportTypeRow}>
              {REPORT_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  style={[styles.reportTypeChip, reportType === type.key && styles.reportTypeChipActive]}
                  onPress={() => setReportType(type.key)}
                >
                  <Text style={[styles.reportTypeChipText, reportType === type.key && styles.reportTypeChipTextActive]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.reportInput}
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder="Describe what happened..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setShowReportModal(false)} disabled={submittingReport}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitButton} onPress={handleSubmitReport} disabled={submittingReport}>
                <Text style={styles.modalSubmitText}>{submittingReport ? 'Submitting...' : 'Submit Report'}</Text>
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
    backgroundColor: '#F7E1C9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2924',
    fontFamily: 'Georgia',
  },
  spacer: {
    width: 44,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  imageFrame: {
    position: 'relative',
    width: 160,
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#E8DDD0',
  },
  emptyImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(19, 78, 54, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFDF7',
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    color: '#1F2924',
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Georgia',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Georgia',
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFF5E5',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E0D0',
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
    fontFamily: 'Georgia',
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2924',
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Georgia',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: '#1F2924',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Georgia',
  },
  aboutText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Georgia',
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#FFF5E5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E0D0',
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Georgia',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2924',
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  detailText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Georgia',
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  galleryPlaceholder: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF5E5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  galleryPlaceholderWide: {
    flex: 0,
    width: '100%',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 6,
    fontFamily: 'Georgia',
  },
  contactButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9A300',
  },
  contactButtonLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    fontFamily: 'Georgia',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  messageButton: {
    marginBottom: 12,
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    fontFamily: 'Georgia',
  },
  safetyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  safetyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  safetyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 34,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2924',
    marginBottom: 14,
    fontFamily: 'Georgia',
  },
  blockConfirmText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  blockConfirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  blockConfirmCancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  blockConfirmCancelText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  blockConfirmBlockButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
  },
  blockConfirmBlockText: {
    color: '#fff',
    fontWeight: '700',
  },
  reportTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  reportTypeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E3D4C4',
    backgroundColor: '#FFF5E5',
  },
  reportTypeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  reportTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2924',
  },
  reportTypeChipTextActive: {
    color: '#fff',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#E3D4C4',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1F2924',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3D4C4',
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  modalSubmitButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
  },
});
