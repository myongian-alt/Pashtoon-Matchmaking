import React, { useState, useEffect, useRef } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { fonts } from '../theme/typography';
import { useUser } from '../context/UserContext';
import { LoginPromptModal } from '../components/common/LoginPromptModal';
import { ModernMuslimAvatar } from '../components/common/ModernMuslimAvatar';
import { AppBottomNav } from '../components/common/AppBottomNav';
import { ArchFrame } from '../components/common/ArchFrame';
import { MatchScoreStar } from '../components/common/StarBadge';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import {
  sendConnectionRequest,
  blockUser,
  submitReport,
  ReportType,
  trackProfileView,
  getOrCreateConversation,
  requestContactDetails,
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
  const { isGuest, paymentCompleted, userId, profileCompleted } = useUser();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('fake_profile');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [requestingContact, setRequestingContact] = useState(false);
  const [contactRequestSent, setContactRequestSent] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

  // Alert.alert doesn't render anything on the web build (confirmed - no
  // dialog, no callback) so any feedback that relies on it is silently
  // swallowed there; this banner is the one visible-on-every-platform path.
  const showBanner = (type: 'success' | 'error', message: string) => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
    setBanner({ type, message });
    bannerTimeoutRef.current = setTimeout(() => setBanner(null), 3500);
  };

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
      showBanner('error', 'This demo profile is not connected to a real account yet.');
      return;
    }

    setSendingInterest(true);
    const result = await sendConnectionRequest(profile.userId);
    setSendingInterest(false);

    if (result.error) {
      const message =
        typeof result.error === 'string' ? result.error : (result.error as any)?.message || '';
      if (message.includes('23505') || message.toLowerCase().includes('duplicate')) {
        showBanner('error', 'You already sent an interest request to this profile.');
      } else {
        showBanner('error', 'Could not send interest. Please try again.');
      }
      return;
    }

    setInterestSent(true);
    showBanner('success', 'Your interest has been sent successfully.');
  };

  const handleSendMessage = async () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    if (!profile?.userId) {
      showBanner('error', 'This demo profile is not connected to a real account yet.');
      return;
    }

    if (!userId) {
      return;
    }

    setSendingMessage(true);
    const result = await getOrCreateConversation(userId, profile.userId);
    setSendingMessage(false);

    if (result.error || !result.data) {
      showBanner('error', 'Could not start conversation. Please try again.');
      return;
    }

    navigation.navigate('Chat', {
      conversationId: result.data.id,
      counterpartName: profile.name,
      counterpartUserId: profile.userId,
    });
  };

  const handleRequestContactDetails = async () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    if (!profile?.userId) {
      showBanner('error', 'This demo profile is not connected to a real account yet.');
      return;
    }

    setRequestingContact(true);
    const result = await requestContactDetails(profile.userId);
    setRequestingContact(false);

    if (!result.success) {
      showBanner('error', 'Could not send request. Please try again.');
      return;
    }

    setContactRequestSent(true);
    // Honest about what actually happens: a real Resend-based email goes to
    // the admin team (request-contact-details Edge Function) - there is no
    // WhatsApp Business API integration in this environment, so this must
    // not promise a WhatsApp message it can't deliver.
    showBanner('success', "Rishta request sent - we'll email you with next steps soon.");
  };

  // A confirm-style Alert.alert (Cancel/Block buttons with an onPress
  // callback) never fires on the web build - no dialog, no callback, the
  // button just does nothing - so this needs a real in-app modal instead.
  const handleBlock = () => {
    if (!profile?.userId) {
      showBanner('error', 'This demo profile is not connected to a real account yet.');
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
      showBanner('error', 'Could not block. Please try again.');
      return;
    }

    setShowBlockConfirm(false);
    navigation.goBack();
  };

  const handleSubmitReport = async () => {
    if (!profile?.userId) {
      showBanner('error', 'This demo profile is not connected to a real account yet.');
      return;
    }

    if (!reportDescription.trim()) {
      showBanner('error', 'Please describe what happened before submitting.');
      return;
    }

    setSubmittingReport(true);
    const result = await submitReport(profile.userId, reportType, reportDescription.trim());
    setSubmittingReport(false);

    if (result.error) {
      showBanner('error', 'Could not submit report. Please try again.');
      return;
    }

    setShowReportModal(false);
    setReportDescription('');
    showBanner('success', 'Report submitted - our team will review this.');
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

      {banner ? (
        <View style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
          <MaterialCommunityIcons
            name={banner.type === 'error' ? 'alert-circle-outline' : 'check-circle-outline'}
            size={18}
            color="#fff"
          />
          <Text style={styles.bannerText}>{banner.message}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Image with Gender Badge + Match Score - match percentage
            shown first/prominently, right under the photo, before any other
            detail. */}
        <View style={styles.imageContainer}>
          <View style={styles.imageFrame}>
            <ArchFrame width={160} height={160} borderColor={theme.colors.gold} borderWidth={3}>
              {profileImageSource ? (
                <Image source={profileImageSource} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.emptyImage]}>
                  <ModernMuslimAvatar gender={profile?.gender === 'female' ? 'female' : 'male'} size={90} />
                </View>
              )}
            </ArchFrame>
            <View style={styles.genderBadge}>
              {profile.gender === 'male' ? (
                <MaterialCommunityIcons name="human-male" size={18} color="#fff" />
              ) : (
                <MaterialCommunityIcons name="human-female" size={18} color="#fff" />
              )}
            </View>

            {!isSelfProfile && (
              <View style={styles.matchScoreFloating}>
                {profileCompleted ? (
                  <MatchScoreStar percent={profile?.compatibility || 0} size={64} />
                ) : (
                  <Pressable onPress={handleEditMyProfile}>
                    <MatchScoreStar percent={0} size={64} />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>

        {!isSelfProfile && !profileCompleted && (
          <Pressable style={styles.completeProfileBanner} onPress={handleEditMyProfile}>
            <MaterialCommunityIcons name="progress-question" size={18} color={theme.colors.emerald} />
            <Text style={styles.completeProfileBannerText}>
              Complete your profile to see your exact match percentage
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.emerald} />
          </Pressable>
        )}

        {/* Header Info with Marital Status */}
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.name || 'Your Profile'}</Text>
            {profile?.isVerified && <VerifiedBadge size="large" />}
          </View>
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
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Skin Tone</Text>
              <Text style={styles.detailValue}>{profile?.skinColour || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Faith & Lifestyle - newly available now that the full profile
            form actually persists these fields (see database.ts). */}
        {profile?.prayerFrequency ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="mosque" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Faith</Text>
            </View>
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <MaterialCommunityIcons name="star-crescent" size={14} color={theme.colors.gold} />
                <Text style={styles.pillText}>Prayers: {profile.prayerFrequency}</Text>
              </View>
            </View>
          </View>
        ) : null}

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

        {/* Send Rishta Request Button - golden tab with a red/heart accent,
            per the brief. Admin gets a real email (request-contact-details
            Edge Function); the user is told about email follow-up only -
            no WhatsApp integration exists in this environment, so the copy
            must not promise one. */}
        {!isSelfProfile ? (
          <Pressable
            style={[styles.contactButton, (requestingContact || contactRequestSent) && styles.actionButtonDisabled]}
            onPress={handleRequestContactDetails}
            disabled={requestingContact || contactRequestSent}
          >
            <MaterialCommunityIcons
              name={contactRequestSent ? 'check-circle' : 'heart'}
              size={20}
              color={theme.colors.pomegranateBright}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.contactButtonLabel}>
              {requestingContact
                ? 'Sending request...'
                : contactRequestSent
                ? 'Rishta Request Sent'
                : 'Send Rishta Request'}
            </Text>
          </Pressable>
        ) : null}
        {!isSelfProfile && contactRequestSent ? (
          <Text style={styles.contactFollowupText}>
            We'll review and email you with next steps soon.
          </Text>
        ) : null}

        {/* Send Message Button */}
        {!isSelfProfile ? (
          <Pressable
            style={[styles.actionButton, styles.messageButton, sendingMessage && styles.actionButtonDisabled]}
            onPress={handleSendMessage}
            disabled={sendingMessage}
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.actionLabel}>
              {sendingMessage ? 'Opening chat...' : 'Send a Message'}
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
    backgroundColor: theme.colors.ivory,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.invitationCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerSuccess: {
    backgroundColor: theme.colors.emerald,
  },
  bannerError: {
    backgroundColor: theme.colors.pomegranateBright,
  },
  bannerText: {
    flex: 1,
    color: '#fff',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: theme.colors.ink,
    fontFamily: fonts.heading,
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
  },
  emptyImage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
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
    borderColor: theme.colors.invitationCard,
  },
  matchScoreFloating: {
    position: 'absolute',
    bottom: -18,
    left: -10,
  },
  completeProfileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.emeraldTint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.emerald,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  completeProfileBannerText: {
    flex: 1,
    color: theme.colors.emerald,
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: theme.colors.ink,
    fontSize: 24,
    fontFamily: fonts.nameItalic,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.mutedText,
    fontSize: 15,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: theme.colors.sand,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.mutedText,
    marginTop: 6,
    fontFamily: fonts.bodyMedium,
  },
  infoValue: {
    fontSize: 13,
    color: theme.colors.ink,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: fonts.labelBold,
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
    color: theme.colors.ink,
    fontSize: 18,
    fontFamily: fonts.labelBold,
  },
  aboutText: {
    color: theme.colors.bodyText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.body,
  },
  detailCard: {
    flex: 1,
    backgroundColor: theme.colors.sand,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.mutedText,
    marginBottom: 4,
    fontFamily: fonts.bodyMedium,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.ink,
    fontFamily: fonts.labelBold,
  },
  detailText: {
    color: theme.colors.bodyText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.body,
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
    borderColor: theme.colors.emerald,
    backgroundColor: theme.colors.sand,
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
    color: theme.colors.emerald,
    marginTop: 6,
    fontFamily: fonts.bodyMedium,
  },
  contactButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: theme.colors.pomegranateBright,
    shadowColor: theme.colors.gold,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  contactButtonLabel: {
    color: theme.colors.pomegranateDeep,
    fontFamily: fonts.labelBold,
    fontSize: 16,
  },
  contactFollowupText: {
    color: theme.colors.mutedText,
    fontFamily: fonts.body,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.sand,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    color: theme.colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
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
    fontSize: 16,
    fontFamily: fonts.labelBold,
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
    fontFamily: fonts.bodyMedium,
    color: theme.colors.mutedText,
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
  },
  modalTitle: {
    fontSize: 18,
    color: theme.colors.ink,
    marginBottom: 14,
    fontFamily: fonts.labelBold,
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
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.sand,
  },
  reportTypeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  reportTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reportTypeChipTextActive: {
    color: '#fff',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: theme.colors.text,
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
    borderColor: theme.colors.cardBorder,
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
