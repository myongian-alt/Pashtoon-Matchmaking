import React, { useState, useEffect } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { LoginPromptModal } from '../components/common/LoginPromptModal';
import { ModernMuslimAvatar } from '../components/common/ModernMuslimAvatar';
import { AppBottomNav } from '../components/common/AppBottomNav';

export function ProfileDetailScreen({ route, navigation }: any) {
  const profile = route.params?.profile;
  const { isGuest, paymentCompleted } = useUser();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
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
          {profileImageSource ? (
            <Image source={profileImageSource} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.emptyImage]}>
              <ModernMuslimAvatar gender={profile?.gender === 'female' ? 'female' : 'male'} size={140} />
            </View>
          )}
          <View style={styles.genderBadge}>
            {profile.gender === 'male' ? (
              <MaterialCommunityIcons name="human-male" size={28} color="#fff" />
            ) : (
              <MaterialCommunityIcons name="human-female" size={28} color="#fff" />
            )}
          </View>
        </View>

        {/* Header Info with Marital Status */}
        <View style={styles.headerInfo}>
          <View>
            <Text style={styles.name}>{profile?.name || 'Your Profile'}</Text>
            <Text style={styles.subtitle}>{profile?.age ? `${profile.age} years old` : 'Age not provided'}</Text>
          </View>
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

        {/* Send Interest Button */}
        {!isSelfProfile ? (
          <Pressable style={styles.actionButton} onPress={() => {}}>
            <MaterialCommunityIcons name="heart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionLabel}>Send Interest</Text>
          </Pressable>
        ) : null}

        {isSelfProfile ? (
          <Pressable style={styles.actionButton} onPress={handleEditMyProfile}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionLabel}>Edit My Profile</Text>
          </Pressable>
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
    position: 'relative',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    backgroundColor: '#E8DDD0',
  },
  emptyImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(19, 78, 54, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    marginBottom: 16,
  },
  name: {
    color: '#1F2924',
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Georgia',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Georgia',
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
  actionLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    fontFamily: 'Georgia',
  },
});
