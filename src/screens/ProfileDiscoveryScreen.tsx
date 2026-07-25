import React, { useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, FlatList, Image, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDiscoveryProfiles, getMatches, likeProfile, EDUCATION_LEVEL_DISPLAY } from '../lib/database';
import { ModernMuslimAvatar } from '../components/common/ModernMuslimAvatar';
import { LoginPromptModal } from '../components/common/LoginPromptModal';
import { SmartRecommendationsStrip } from '../components/ai/SmartRecommendationsStrip';
import {
  getSmartMatchRecommendationsForCurrentUser,
  RecommendationCandidate,
  SmartMatchRecommendation,
} from '../lib/aiCoach';

type ProfileListItem = {
  id: string;
  userId?: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  maritalStatus: string;
  currentCity: string;
  education?: string;
  profession?: string;
  location: string;
  image?: any;
  aboutMe?: string;
  compatibility?: number;
  source: 'discover' | 'matches';
};

type DiscoveryFilters = {
  location: string;
  education: string;
  profession: string;
  ageMin: string;
  ageMax: string;
};

const EMPTY_FILTERS: DiscoveryFilters = {
  location: '',
  education: '',
  profession: '',
  ageMin: '',
  ageMax: '',
};

const fallbackDiscoverProfiles: ProfileListItem[] = [
  {
    id: 'sample-discover-1',
    name: 'Ayesha Khan',
    age: 25,
    gender: 'female',
    maritalStatus: 'Never Married',
    currentCity: 'Kabul',
    location: 'Kabul, Afghanistan',
    education: 'Masters',
    profession: 'Doctor',
    image: null,
    source: 'discover',
  },
  {
    id: 'sample-discover-2',
    name: 'Ahmed Khan',
    age: 28,
    gender: 'male',
    maritalStatus: 'Never Married',
    currentCity: 'Peshawar',
    location: 'Peshawar, Pakistan',
    education: 'Bachelors',
    profession: 'Software Engineer',
    image: null,
    source: 'discover',
  },
  {
    id: 'sample-discover-3',
    name: 'Fatima Noor',
    age: 24,
    gender: 'female',
    maritalStatus: 'Never Married',
    currentCity: 'Lahore',
    location: 'Lahore, Pakistan',
    education: 'Bachelors',
    profession: 'Teacher',
    image: null,
    source: 'discover',
  },
  {
    id: 'sample-discover-4',
    name: 'Omar Siddiq',
    age: 30,
    gender: 'male',
    maritalStatus: 'Divorced',
    currentCity: 'Dubai',
    location: 'Dubai, UAE',
    education: 'MBA',
    profession: 'Business Analyst',
    image: null,
    source: 'discover',
  },
];

const fallbackMatchProfiles: ProfileListItem[] = [
  {
    id: 'sample-match-1',
    name: 'Mariam Yusuf',
    age: 27,
    gender: 'female',
    maritalStatus: 'Never Married',
    currentCity: 'Islamabad',
    location: 'Islamabad, Pakistan',
    education: 'Masters',
    profession: 'Pharmacist',
    image: null,
    compatibility: 92,
    source: 'matches',
  },
  {
    id: 'sample-match-2',
    name: 'Bilal Rahman',
    age: 29,
    gender: 'male',
    maritalStatus: 'Never Married',
    currentCity: 'Doha',
    location: 'Doha, Qatar',
    education: 'Bachelors',
    profession: 'Civil Engineer',
    image: null,
    compatibility: 89,
    source: 'matches',
  },
];

function toDisplayMaritalStatus(value?: string) {
  switch (value) {
    case 'never_married':
      return 'Never Married';
    case 'married':
      return 'Married';
    case 'divorced':
      return 'Divorced';
    case 'widowed':
      return 'Widowed';
    case 'separated':
      return 'Separated';
    default:
      return 'Not set';
  }
}

function toAge(dateOfBirth?: string) {
  if (!dateOfBirth) {
    return 0;
  }

  const birthYear = Number(dateOfBirth.slice(0, 4));
  if (!birthYear || Number.isNaN(birthYear)) {
    return 0;
  }

  return Math.max(18, new Date().getFullYear() - birthYear);
}

function toListItemFromProfile(row: any, source: 'discover' | 'matches'): ProfileListItem {
  const primaryPhoto = (row.profile_photos || []).find((photo: any) => photo.photo_type === 'profile_picture');
  const fallbackPhoto = (row.profile_photos || [])[0];
  const imageUri = primaryPhoto?.photo_url || fallbackPhoto?.photo_url || null;
  const country = row.nationality || '';
  const city = row.current_city || '';
  const gender = row.users?.gender_preference === 'female' || row.user?.gender_preference === 'female' ? 'female' : 'male';

  return {
    id: row.id || row.user_id || row.counterpart_user_id,
    userId: row.user_id || row.counterpart_user_id || undefined,
    name: row.full_name || 'Unnamed profile',
    age: toAge(row.date_of_birth),
    gender,
    maritalStatus: toDisplayMaritalStatus(row.marital_status),
    currentCity: city || 'Not set',
    education: row.education_level ? EDUCATION_LEVEL_DISPLAY[row.education_level] || row.education_level : 'Not set',
    profession: row.profession || 'Not set',
    location: [city, country].filter(Boolean).join(', ') || 'Not set',
    image: imageUri ? { uri: imageUri } : null,
    aboutMe: row.about_me || '',
    compatibility: row.match_score || row.profile_strength_percentage || 80,
    source,
  };
}

function mergeWithSamples(
  list: ProfileListItem[],
  samples: ProfileListItem[],
  minItems: number,
  genderFilter?: 'male' | 'female'
) {
  const visibleSamples = genderFilter ? samples.filter((item) => item.gender === genderFilter) : samples;

  if (list.length >= minItems) {
    return list;
  }

  const existing = new Set(list.map((item) => item.id));
  const toAppend = visibleSamples.filter((item) => !existing.has(item.id));
  return [...list, ...toAppend].slice(0, Math.max(minItems, list.length));
}

function matchesText(value: string | undefined, term: string) {
  if (!term.trim()) {
    return true;
  }

  return (value || '').toLowerCase().includes(term.trim().toLowerCase());
}

function applyFilters(list: ProfileListItem[], filters: DiscoveryFilters) {
  const minAge = Number(filters.ageMin);
  const maxAge = Number(filters.ageMax);
  const hasMinAge = Number.isFinite(minAge) && minAge > 0;
  const hasMaxAge = Number.isFinite(maxAge) && maxAge > 0;

  return list.filter((item) => {
    if (!matchesText(item.location, filters.location) && !matchesText(item.currentCity, filters.location)) {
      return false;
    }

    if (!matchesText(item.education, filters.education)) {
      return false;
    }

    if (!matchesText(item.profession, filters.profession)) {
      return false;
    }

    if (hasMinAge && item.age > 0 && item.age < minAge) {
      return false;
    }

    if (hasMaxAge && item.age > 0 && item.age > maxAge) {
      return false;
    }

    return true;
  });
}

export default function ProfileDiscoveryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedGender, userId, loading, isGuest } = useUser();
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [discoverProfiles, setDiscoverProfiles] = useState<ProfileListItem[]>([]);
  const [matchedProfiles, setMatchedProfiles] = useState<ProfileListItem[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [activeMode, setActiveMode] = useState<'discover' | 'matches'>('discover');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<DiscoveryFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<DiscoveryFilters>(EMPTY_FILTERS);
  const [smartRecommendations, setSmartRecommendations] = useState<SmartMatchRecommendation[]>([]);

  const targetGender = useMemo(() => {
    if (selectedGender === 'male') return 'female';
    if (selectedGender === 'female') return 'male';
    return undefined;
  }, [selectedGender]);

  useEffect(() => {
    let isMounted = true;

    const loadDiscover = async () => {
      if (loading) {
        return;
      }

      if (!userId) {
        // Guests aren't authenticated against Supabase - show sample profiles
        // instead of leaving the screen stuck on "Loading profiles...".
        const genderFiltered = targetGender
          ? fallbackDiscoverProfiles.filter((item) => item.gender === targetGender)
          : fallbackDiscoverProfiles;
        setDiscoverProfiles(genderFiltered);
        setLoadingDiscover(false);
        return;
      }

      setLoadingDiscover(true);
      const result = await getDiscoveryProfiles(userId, {
        gender_seeking: targetGender,
        limit: 40,
      });

      if (!isMounted) {
        return;
      }

      if (result.error || !result.data) {
        const genderFiltered = targetGender
          ? fallbackDiscoverProfiles.filter((item) => item.gender === targetGender)
          : fallbackDiscoverProfiles;
        setDiscoverProfiles(genderFiltered);
        setLoadingDiscover(false);
        return;
      }

      const mapped = result.data.map((row: any) => toListItemFromProfile(row, 'discover'));
      const combined = mergeWithSamples(mapped, fallbackDiscoverProfiles, 6, targetGender);
      setDiscoverProfiles(combined);
      setLoadingDiscover(false);
    };

    const loadMatches = async () => {
      if (loading) {
        return;
      }

      if (!userId) {
        setMatchedProfiles(fallbackMatchProfiles);
        setLoadingMatches(false);
        return;
      }

      setLoadingMatches(true);
      const result = await getMatches(userId);

      if (!isMounted) {
        return;
      }

      if (result.error || !result.data) {
        setMatchedProfiles(fallbackMatchProfiles);
        setLoadingMatches(false);
        return;
      }

      const mapped = result.data
        .filter((row: any) => row.profile)
        .map((row: any) => {
          const profileRow = {
            ...row.profile,
            id: row.id,
            user: row.user,
            match_score: row.match_score,
          };
          return toListItemFromProfile(profileRow, 'matches');
        });

      const combined = mergeWithSamples(mapped, fallbackMatchProfiles, 4, targetGender);
      setMatchedProfiles(combined);
      setLoadingMatches(false);
    };

    loadDiscover();
    loadMatches();

    return () => {
      isMounted = false;
    };
  }, [loading, userId, targetGender]);

  useEffect(() => {
    let mounted = true;

    const loadRecommendations = async () => {
      if (!discoverProfiles.length) {
        setSmartRecommendations([]);
        return;
      }

      const candidates: RecommendationCandidate[] = discoverProfiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        currentCity: profile.currentCity,
        location: profile.location,
        education: profile.education,
        profession: profile.profession,
        compatibility: profile.compatibility,
        image: profile.image,
      }));

      const result = await getSmartMatchRecommendationsForCurrentUser(candidates, 4);

      if (!mounted || result.error) {
        return;
      }

      setSmartRecommendations(result.data);
    };

    loadRecommendations();

    return () => {
      mounted = false;
    };
  }, [discoverProfiles]);

  const handleLike = async (item: ProfileListItem) => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    setLikedProfiles((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));

    if (!item.userId) {
      // Demo/sample profile with no backing user row - nothing to persist.
      return;
    }

    const result = await likeProfile(item.userId, 'like');
    if (result.error) {
      setLikedProfiles((prev) => prev.filter((id) => id !== item.id));
      Alert.alert('Could not save like', 'Please try again.');
    }
  };

  const handleSkip = async (item: ProfileListItem) => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    const removeFromList = (list: ProfileListItem[]) => list.filter((profile) => profile.id !== item.id);
    if (activeMode === 'discover') {
      setDiscoverProfiles(removeFromList);
    } else {
      setMatchedProfiles(removeFromList);
    }

    if (!item.userId) {
      return;
    }

    const result = await likeProfile(item.userId, 'reject');
    if (result.error) {
      Alert.alert('Could not save', 'Please try again.');
    }
  };

  const handleViewProfile = (profile: ProfileListItem) => {
    navigation.navigate('ProfileDetail', {
      profile,
    });
  };

  const handleOpenRecommendedProfile = (recommendation: SmartMatchRecommendation) => {
    const profile = discoverProfiles.find((candidate) => candidate.id === recommendation.profileId);

    if (profile) {
      handleViewProfile(profile);
    }
  };

  const filteredDiscoverProfiles = useMemo(
    () => applyFilters(discoverProfiles, appliedFilters),
    [discoverProfiles, appliedFilters]
  );

  const filteredMatchedProfiles = useMemo(
    () => applyFilters(matchedProfiles, appliedFilters),
    [matchedProfiles, appliedFilters]
  );

  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilters).filter((value) => value.trim().length > 0).length;
  }, [appliedFilters]);

  const applyFilterChanges = () => {
    setAppliedFilters(draftFilters);
    setFilterModalVisible(false);
  };

  const clearFilterChanges = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const listData = activeMode === 'discover' ? filteredDiscoverProfiles : filteredMatchedProfiles;
  const isLoading = activeMode === 'discover' ? loadingDiscover : loadingMatches;

  const renderProfileCard = ({ item }: { item: ProfileListItem }) => {
    const isLiked = likedProfiles.includes(item.id);

    return (
      <Pressable style={styles.profileCard} onPress={() => handleViewProfile(item)}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={item.image} style={styles.profileImage} />
          ) : (
            <View style={styles.emptyImage}>
              <ModernMuslimAvatar gender={item.gender} size={130} />
            </View>
          )}
        </View>

        <View style={styles.genderBadge}>
          <MaterialCommunityIcons
            name={item.gender === 'male' ? 'human-male' : 'human-female'}
            size={28}
            color="#fff"
          />
        </View>

        {item.source === 'matches' ? (
          <View style={styles.matchBadge}>
            <MaterialCommunityIcons name="star" size={14} color="#fff" />
            <Text style={styles.matchBadgeText}>Matched</Text>
          </View>
        ) : null}

        <View style={styles.cardContent}>
          <Text style={styles.profileName}>{item.name}</Text>

          <View style={styles.ageLocationRow}>
            <MaterialCommunityIcons name="cake-variant" size={16} color="#C9A876" />
            <Text style={styles.infoText}>{item.age ? `${item.age} years` : 'Age not set'}</Text>
            <MaterialCommunityIcons name="map-marker" size={16} color="#C9A876" style={{ marginLeft: 12 }} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>

          <View style={styles.maritalStatusRow}>
            <MaterialCommunityIcons name="ring" size={14} color="#D4AF37" />
            <Text style={styles.maritalStatusText}>{item.maritalStatus}</Text>
          </View>

          <View style={styles.biodataSection}>
            <View style={styles.biodataItem}>
              <MaterialCommunityIcons name="school" size={18} color={theme.colors.primary} />
              <Text style={styles.biodataLabel}>Education</Text>
              <Text style={styles.biodataValue}>{item.education || 'Not set'}</Text>
            </View>
            <View style={[styles.biodataItem, styles.biodataItemWithTopSpacing]}>
              <MaterialCommunityIcons name="briefcase" size={18} color={theme.colors.primary} />
              <Text style={styles.biodataLabel}>Profession</Text>
              <Text style={styles.biodataValue}>{item.profession || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable style={styles.skipButton} onPress={() => handleSkip(item)}>
              <MaterialCommunityIcons name="close" size={20} color={theme.colors.primary} />
              <Text style={styles.buttonLabel}>Skip</Text>
            </Pressable>

            <Pressable style={[styles.likeButton, isLiked && styles.likeButtonActive]} onPress={() => handleLike(item)}>
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={isLiked ? '#E74C3C' : '#FFFFFF'}
              />
              <Text style={styles.likeButtonLabel}>{isLiked ? 'Liked' : 'Like'}</Text>
            </Pressable>

            <Pressable style={styles.viewButton} onPress={() => handleViewProfile(item)}>
              <MaterialCommunityIcons name="eye" size={20} color={theme.colors.primary} />
              <Text style={styles.buttonLabel}>View</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Discover & Matches</Text>
        <Pressable
          style={styles.filterButton}
          onPress={() => {
            setDraftFilters(appliedFilters);
            setFilterModalVisible(true);
          }}
        >
          <MaterialCommunityIcons name="tune-variant" size={20} color={theme.colors.primary} />
          {activeFilterCount > 0 ? <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View> : null}
        </Pressable>
      </View>

      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentButton, activeMode === 'discover' && styles.segmentButtonActive]}
          onPress={() => setActiveMode('discover')}
        >
          <Text style={[styles.segmentText, activeMode === 'discover' && styles.segmentTextActive]}>Discover</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, activeMode === 'matches' && styles.segmentButtonActive]}
          onPress={() => setActiveMode('matches')}
        >
          <Text style={[styles.segmentText, activeMode === 'matches' && styles.segmentTextActive]}>
            Matches ({filteredMatchedProfiles.length})
          </Text>
        </Pressable>
      </View>

      <View style={styles.activeFilterStrip}>
        <Text style={styles.activeFilterText}>
          {activeFilterCount > 0
            ? `Filtered by ${activeFilterCount} field${activeFilterCount > 1 ? 's' : ''}`
            : 'No filters applied'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading profiles...</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => `${activeMode}-${item.id}`}
          numColumns={1}
          contentContainerStyle={styles.profilesList}
          ListHeaderComponent={
            activeMode === 'discover' ? (
              <SmartRecommendationsStrip
                recommendations={smartRecommendations}
                onOpenProfile={handleOpenRecommendedProfile}
              />
            ) : null
          }
          renderItem={renderProfileCard}
          ListEmptyComponent={
            <View style={styles.loaderContainer}>
              <Text style={styles.loaderText}>
                {activeMode === 'matches' ? 'No matches yet. Start liking profiles in Discover.' : 'No profiles found yet.'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Filter Profiles</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.filterInput}
                value={draftFilters.location}
                onChangeText={(value) => setDraftFilters((prev) => ({ ...prev, location: value }))}
                placeholder="City or country"
                placeholderTextColor="#9A8F84"
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Education</Text>
              <TextInput
                style={styles.filterInput}
                value={draftFilters.education}
                onChangeText={(value) => setDraftFilters((prev) => ({ ...prev, education: value }))}
                placeholder="Bachelors, Masters..."
                placeholderTextColor="#9A8F84"
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Profession</Text>
              <TextInput
                style={styles.filterInput}
                value={draftFilters.profession}
                onChangeText={(value) => setDraftFilters((prev) => ({ ...prev, profession: value }))}
                placeholder="Engineer, Doctor..."
                placeholderTextColor="#9A8F84"
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Age Range</Text>
              <View style={styles.ageRow}>
                <View style={styles.ageInputWrap}>
                  <TextInput
                    style={styles.filterInput}
                    value={draftFilters.ageMin}
                    keyboardType="number-pad"
                    onChangeText={(value) => setDraftFilters((prev) => ({ ...prev, ageMin: value }))}
                    placeholder="Min"
                    placeholderTextColor="#9A8F84"
                  />
                </View>
                <View style={styles.ageInputWrap}>
                  <TextInput
                    style={styles.filterInput}
                    value={draftFilters.ageMax}
                    keyboardType="number-pad"
                    onChangeText={(value) => setDraftFilters((prev) => ({ ...prev, ageMax: value }))}
                    placeholder="Max"
                    placeholderTextColor="#9A8F84"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.clearButton} onPress={clearFilterChanges}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={applyFilterChanges}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <LoginPromptModal
        visible={showLoginPrompt}
        onLoginWithEmail={() => {
          setShowLoginPrompt(false);
          navigation.navigate('EmailAuth');
        }}
        onLoginWithPhone={() => {
          setShowLoginPrompt(false);
          navigation.navigate('PhoneAuth');
        }}
        onDismiss={() => setShowLoginPrompt(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7E1C9' },
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
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '800',
  },
  activeFilterStrip: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF5E5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0DAB9',
  },
  activeFilterText: {
    color: '#6A5134',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF5E5',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#fff',
  },
  profilesList: { padding: 16, paddingBottom: 100 },
  profileCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  imageContainer: { width: '100%', height: 260, backgroundColor: '#F0E8E0' },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyImage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5E5' },
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
    zIndex: 10,
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: { padding: 20 },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2924',
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  ageLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoText: { fontSize: 14, color: '#5A6360', fontFamily: 'Georgia', flexShrink: 1 },
  maritalStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  maritalStatusText: { fontSize: 13, color: '#D4AF37', fontWeight: '700', fontFamily: 'Georgia' },
  biodataSection: {
    backgroundColor: '#F5E6D3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  biodataItem: { alignItems: 'center' },
  biodataItemWithTopSpacing: { marginTop: 12 },
  biodataLabel: { fontSize: 12, color: '#5A6360', fontFamily: 'Georgia', marginTop: 6, fontWeight: '600' },
  biodataValue: { fontSize: 13, color: '#1F2924', fontFamily: 'Georgia', fontWeight: '700', marginTop: 2, textAlign: 'center' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  skipButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 6,
  },
  likeButton: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  likeButtonActive: { backgroundColor: '#E74C3C' },
  viewButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 6,
  },
  buttonLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, fontFamily: 'Georgia' },
  likeButtonLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Georgia' },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loaderText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2924',
    marginBottom: 14,
    fontFamily: 'Georgia',
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3D443F',
    marginBottom: 6,
  },
  filterInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3D4C4',
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F2924',
  },
  ageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ageInputWrap: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    height: 46,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
