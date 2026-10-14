import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, FlatList, Image, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { fonts } from '../theme/typography';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDiscoveryProfiles, getMatches, likeProfile, removeLike, getShortlistedProfiles, getWhoLikedMe, getConversationWithUser, EDUCATION_LEVEL_DISPLAY, PRAYER_FREQUENCY_DISPLAY, cmToHeightLabel } from '../lib/database';
import { ModernMuslimAvatar } from '../components/common/ModernMuslimAvatar';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
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
  photoCount?: number;
  isVerified?: boolean;
  height?: string;
  prayerFrequency?: string;
  skinColour?: string;
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
    aboutMe: 'Looking for someone kind, family-oriented, and grounded in faith.',
    photoCount: 3,
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
    aboutMe: 'Simple, hardworking, and looking to build a future rooted in our traditions.',
    photoCount: 4,
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
    aboutMe: 'Love teaching and spending time with family. Seeking a respectful partner.',
    photoCount: 2,
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
    aboutMe: 'Settled professional looking for a genuine connection and a peaceful home.',
    photoCount: 5,
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
    photoCount: (row.profile_photos || []).length,
    isVerified: Boolean(row.is_verified),
    height: cmToHeightLabel(row.height_cm) || undefined,
    prayerFrequency: PRAYER_FREQUENCY_DISPLAY[row.prayer_frequency] || undefined,
    skinColour: row.skin_colour || undefined,
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
  const [shortlistedProfiles, setShortlistedProfiles] = useState<string[]>([]);
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
  const [likesYouCount, setLikesYouCount] = useState(0);

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
        const genderFiltered = targetGender
          ? fallbackMatchProfiles.filter((item) => item.gender === targetGender)
          : fallbackMatchProfiles;
        setMatchedProfiles(genderFiltered);
        setLoadingMatches(false);
        return;
      }

      setLoadingMatches(true);
      const result = await getMatches(userId);

      if (!isMounted) {
        return;
      }

      if (result.error || !result.data) {
        const genderFiltered = targetGender
          ? fallbackMatchProfiles.filter((item) => item.gender === targetGender)
          : fallbackMatchProfiles;
        setMatchedProfiles(genderFiltered);
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
        })
        .filter((item) => !targetGender || item.gender === targetGender);

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
    let isMounted = true;

    const hydrateShortlisted = async () => {
      if (!userId || (!discoverProfiles.length && !matchedProfiles.length)) {
        return;
      }

      const result = await getShortlistedProfiles(userId);
      if (!isMounted || result.error || !result.data) {
        return;
      }

      const shortlistedUserIds = new Set(result.data.map((row: any) => row.userId));
      const matchingIds = [...discoverProfiles, ...matchedProfiles]
        .filter((item) => item.userId && shortlistedUserIds.has(item.userId))
        .map((item) => item.id);

      setShortlistedProfiles((prev) => Array.from(new Set([...prev, ...matchingIds])));
    };

    hydrateShortlisted();

    return () => {
      isMounted = false;
    };
  }, [userId, discoverProfiles, matchedProfiles]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setLikesYouCount(0);
        return;
      }

      let isMounted = true;
      getWhoLikedMe(userId).then((result) => {
        if (isMounted && !result.error) {
          setLikesYouCount((result.data || []).length);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [userId])
  );

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

  const handleShortlist = async (item: ProfileListItem) => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    const isShortlisted = shortlistedProfiles.includes(item.id);
    setShortlistedProfiles((prev) =>
      isShortlisted ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );

    if (!item.userId) {
      return;
    }

    const result = isShortlisted ? await removeLike(item.userId) : await likeProfile(item.userId, 'shortlist');
    if (result.error) {
      setShortlistedProfiles((prev) =>
        isShortlisted ? [...prev, item.id] : prev.filter((id) => id !== item.id)
      );
      Alert.alert('Could not update favorites', 'Please try again.');
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

  const handleMessage = async (item: ProfileListItem) => {
    if (!userId || !item.userId) {
      Alert.alert('Not available', 'Could not open this conversation right now.');
      return;
    }

    const result = await getConversationWithUser(userId, item.userId);

    if (result.error || !result.data) {
      Alert.alert('Conversation not found', 'You need to match with this person before you can message them.');
      return;
    }

    navigation.navigate('Chat', {
      conversationId: result.data.id,
      counterpartName: item.name,
      counterpartUserId: item.userId,
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

  // Matches only - Discover uses the compact grid below (renderDiscoverGridCard).
  const renderMatchCard = ({ item }: { item: ProfileListItem }) => {
    return (
      <Pressable style={styles.profileCard} onPress={() => handleViewProfile(item)}>
        <View style={styles.cardContent}>
          <View style={styles.matchHeaderRow}>
            <View style={styles.matchImageFrame}>
              {item.image ? (
                <Image source={item.image} style={styles.matchImage} resizeMode="cover" />
              ) : (
                <View style={[styles.matchImage, styles.emptyImage]}>
                  <ModernMuslimAvatar gender={item.gender} size={56} />
                </View>
              )}
              <View style={styles.matchGenderBadge}>
                <MaterialCommunityIcons
                  name={item.gender === 'male' ? 'human-male' : 'human-female'}
                  size={14}
                  color="#fff"
                />
              </View>
            </View>

            <View style={styles.matchHeaderInfo}>
              <View style={styles.matchBadge}>
                <MaterialCommunityIcons name="star" size={12} color="#fff" />
                <Text style={styles.matchBadgeText}>Matched</Text>
              </View>
              <Text style={styles.profileName} numberOfLines={1}>{item.name}</Text>
              {item.isVerified && <VerifiedBadge />}
              <View style={styles.ageLocationRow}>
                <MaterialCommunityIcons name="cake-variant" size={14} color={theme.colors.gold} />
                <Text style={styles.infoText}>{item.age ? `${item.age} years` : 'Age not set'}</Text>
                <MaterialCommunityIcons name="map-marker" size={14} color={theme.colors.gold} style={{ marginLeft: 10 }} />
                <Text style={styles.infoText} numberOfLines={1}>{item.location}</Text>
              </View>
              <View style={styles.maritalStatusRow}>
                <MaterialCommunityIcons name="ring" size={13} color={theme.colors.gold} />
                <Text style={styles.maritalStatusText}>{item.maritalStatus}</Text>
              </View>
            </View>
          </View>

          {item.aboutMe ? (
            <Text style={styles.aboutMeText} numberOfLines={2}>
              {item.aboutMe}
            </Text>
          ) : null}

          <View style={styles.biodataSection}>
            <View style={styles.biodataItem}>
              <MaterialCommunityIcons name="school" size={18} color={theme.colors.primary} />
              <View style={styles.biodataTextCol}>
                <Text style={styles.biodataLabel}>Education</Text>
                <Text style={styles.biodataValue} numberOfLines={1}>{item.education || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.biodataDivider} />
            <View style={styles.biodataItem}>
              <MaterialCommunityIcons name="briefcase" size={18} color={theme.colors.primary} />
              <View style={styles.biodataTextCol}>
                <Text style={styles.biodataLabel}>Profession</Text>
                <Text style={styles.biodataValue} numberOfLines={1}>{item.profession || 'Not set'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable style={styles.viewButton} onPress={() => handleViewProfile(item)}>
              <MaterialCommunityIcons name="eye" size={20} color={theme.colors.primary} />
              <Text style={styles.buttonLabel}>View</Text>
            </Pressable>
            <Pressable style={styles.likeButton} onPress={() => handleMessage(item)}>
              <MaterialCommunityIcons name="chat-outline" size={20} color="#FFFFFF" />
              <Text style={styles.likeButtonLabel}>Message</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderDiscoverGridCard = ({ item }: { item: ProfileListItem }) => {
    const isLiked = likedProfiles.includes(item.id);
    const isShortlisted = shortlistedProfiles.includes(item.id);
    const firstName = (item.name || 'they').split(' ')[0];
    const photoCount = item.photoCount ?? 0;
    // Discover is, by definition, everyone not yet mutually matched - photos
    // stay under a visual lock here until the person accepts a request (see
    // the Matches tab, which shows photos normally since that connection is
    // already mutual). This is a client-side overlay only, not real access
    // control - the underlying photo URL is still directly fetchable. Real
    // enforcement needs a server-side/storage-policy blur, which is a
    // separate, deferred backend task (flagged to the user).
    const isLocked = item.source === 'discover' && !!item.image;

    return (
      <Pressable style={styles.gridCard} onPress={() => handleViewProfile(item)}>
        <View style={styles.gridImageContainer}>
          {item.image ? (
            <Image source={item.image} style={styles.gridImage} resizeMode="cover" />
          ) : (
            <View style={styles.gridEmptyImage}>
              <ModernMuslimAvatar gender={item.gender} size={72} />
            </View>
          )}

          {isLocked && (
            <View style={styles.gridLockOverlay} pointerEvents="none">
              <View style={styles.gridLockIconCircle}>
                <MaterialCommunityIcons name="lock" size={18} color="#fff" />
              </View>
              <Text style={styles.gridLockText} numberOfLines={2}>
                Photos unlock when{'\n'}{firstName} accepts
              </Text>
            </View>
          )}

          {photoCount > 0 && (
            <View style={styles.gridPhotoCountBadge}>
              <MaterialCommunityIcons name="image-multiple" size={12} color="#fff" />
              <Text style={styles.gridPhotoCountText}>{photoCount}</Text>
            </View>
          )}

          <Pressable
            style={styles.gridBookmarkButton}
            onPress={(e: any) => {
              e.stopPropagation?.();
              handleShortlist(item);
            }}
          >
            <MaterialCommunityIcons
              name={isShortlisted ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isShortlisted ? theme.colors.gold : '#fff'}
            />
          </Pressable>

          <View style={styles.gridTopRightActions}>
            <Pressable
              style={styles.gridSkipButton}
              onPress={(e: any) => {
                e.stopPropagation?.();
                handleSkip(item);
              }}
            >
              <MaterialCommunityIcons name="close" size={15} color="#fff" />
            </Pressable>

            <Pressable
              style={[styles.gridLikeButton, isLiked && styles.gridLikeButtonActive]}
              onPress={(e: any) => {
                e.stopPropagation?.();
                handleLike(item);
              }}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={15}
                color={isLiked ? theme.colors.pomegranateBright : '#fff'}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.gridCardContent}>
          <Text style={styles.gridName} numberOfLines={1}>
            {item.name}{item.age ? `, ${item.age}` : ''}
          </Text>
          {item.isVerified && <VerifiedBadge />}
          {item.profession && item.profession !== 'Not set' && (
            <View style={styles.gridInfoRow}>
              <MaterialCommunityIcons name="briefcase" size={12} color={theme.colors.emerald} />
              <Text style={styles.gridInfoText} numberOfLines={1}>{item.profession}</Text>
            </View>
          )}
          {item.education && item.education !== 'Not set' && (
            <View style={styles.gridInfoRow}>
              <MaterialCommunityIcons name="school" size={12} color={theme.colors.emerald} />
              <Text style={styles.gridInfoText} numberOfLines={1}>{item.education}</Text>
            </View>
          )}
          <View style={styles.gridInfoRow}>
            <MaterialCommunityIcons name="map-marker" size={12} color={theme.colors.gold} />
            <Text style={styles.gridInfoText} numberOfLines={1}>{item.location}</Text>
          </View>
          {item.aboutMe ? (
            <Text style={styles.gridMessageText} numberOfLines={2}>{item.aboutMe}</Text>
          ) : null}
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
        <View style={styles.headerActions}>
          <Pressable
            style={styles.filterButton}
            onPress={() => {
              if (isGuest) {
                setShowLoginPrompt(true);
                return;
              }
              navigation.navigate('LikesYou');
            }}
          >
            <MaterialCommunityIcons name="heart-multiple-outline" size={20} color={theme.colors.primary} />
            {likesYouCount > 0 ? <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{likesYouCount}</Text></View> : null}
          </Pressable>
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
          key={activeMode}
          data={listData}
          keyExtractor={(item) => `${activeMode}-${item.id}`}
          numColumns={activeMode === 'discover' ? 2 : 1}
          columnWrapperStyle={activeMode === 'discover' ? styles.gridRow : undefined}
          contentContainerStyle={styles.profilesList}
          ListHeaderComponent={
            activeMode === 'discover' ? (
              <SmartRecommendationsStrip
                recommendations={smartRecommendations}
                onOpenProfile={handleOpenRecommendedProfile}
              />
            ) : null
          }
          renderItem={activeMode === 'discover' ? renderDiscoverGridCard : renderMatchCard}
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
                placeholderTextColor={theme.colors.mutedText}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Education</Text>
              <TextInput
                style={styles.filterInput}
                value={draftFilters.education}
                onChangeText={(value) => setDraftFilters((prev) => ({ ...prev, education: value }))}
                placeholder="Bachelors, Masters..."
                placeholderTextColor={theme.colors.mutedText}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Profession</Text>
              <TextInput
                style={styles.filterInput}
                value={draftFilters.profession}
                onChangeText={(value) => setDraftFilters((prev) => ({ ...prev, profession: value }))}
                placeholder="Engineer, Doctor..."
                placeholderTextColor={theme.colors.mutedText}
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
                    placeholderTextColor={theme.colors.mutedText}
                  />
                </View>
                <View style={styles.ageInputWrap}>
                  <TextInput
                    style={styles.filterInput}
                    value={draftFilters.ageMax}
                    keyboardType="number-pad"
                    onChangeText={(value) => setDraftFilters((prev) => ({ ...prev, ageMax: value }))}
                    placeholder="Max"
                    placeholderTextColor={theme.colors.mutedText}
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
  container: { flex: 1, backgroundColor: theme.colors.ivory },
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.sand,
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
    backgroundColor: theme.colors.pomegranateBright,
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
    backgroundColor: theme.colors.sand,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  activeFilterText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.sand,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.emerald,
    shadowColor: theme.colors.emerald,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    color: theme.colors.emerald,
    fontFamily: fonts.labelBold,
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#fff',
  },
  profilesList: { padding: 16, paddingBottom: 100 },
  gridRow: { justifyContent: 'flex-start', gap: 14 },
  gridCard: {
    flex: 1,
    // Capped so a 2-column tile never balloons past a sensible size on a
    // wide/tablet-width viewport - flex:1 still shrinks it correctly on
    // narrow phone widths, this only clamps the upper bound.
    maxWidth: 210,
    marginBottom: 14,
    // Islamic-arch silhouette: a large top radius reads as a mosque-arch
    // dome, a small bottom radius keeps the footer a normal rounded card -
    // same device ArchFrame uses, applied at the card level (not via that
    // component) since this needs the FlatList's own flex-measured width,
    // not a fixed pixel size.
    borderTopLeftRadius: 54,
    borderTopRightRadius: 54,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    backgroundColor: theme.colors.invitationCard,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gridImageContainer: { width: '100%', aspectRatio: 1, backgroundColor: theme.colors.sand },
  gridLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 76, 58, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  gridLockIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLockText: {
    color: '#fff',
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  gridPhotoCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gridPhotoCountText: {
    color: '#fff',
    fontFamily: fonts.labelBold,
    fontSize: 11,
  },
  gridImage: { width: '100%', height: '100%' },
  gridEmptyImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.sand,
  },
  gridBookmarkButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 78, 54, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTopRightActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  gridSkipButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 78, 54, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLikeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 78, 54, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLikeButtonActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.85)',
  },
  gridCardContent: {
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 3,
  },
  gridName: {
    color: theme.colors.ink,
    fontSize: 16,
    fontFamily: fonts.nameItalic,
    marginBottom: 2,
  },
  gridInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridInfoText: {
    color: theme.colors.bodyText,
    fontSize: 11.5,
    fontFamily: fonts.body,
    flexShrink: 1,
  },
  gridMaritalText: {
    color: theme.colors.gold,
    fontSize: 11.5,
    fontFamily: fonts.labelBold,
  },
  gridBiodataText: {
    color: theme.colors.ink,
    fontSize: 11.5,
    fontFamily: fonts.bodyMedium,
    marginTop: 1,
  },
  gridMessageText: {
    color: theme.colors.mutedText,
    fontSize: 11.5,
    fontFamily: fonts.bodyItalic,
    lineHeight: 15,
    marginTop: 3,
  },
  profileCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: theme.colors.invitationCard,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyImage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.sand },
  matchHeaderRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  matchImageFrame: {
    position: 'relative',
    width: 92,
    height: 92,
    marginRight: 14,
  },
  matchImage: {
    width: '100%',
    height: '100%',
    // Same arch silhouette as the Discover grid card, scaled to this
    // smaller avatar size.
    borderTopLeftRadius: 46,
    borderTopRightRadius: 46,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.sand,
  },
  matchGenderBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(19, 78, 54, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  matchHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.gold,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: { padding: 16 },
  profileName: {
    fontSize: 19,
    color: theme.colors.ink,
    fontFamily: fonts.nameItalic,
    marginBottom: 4,
  },
  ageLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  infoText: { fontSize: 13, color: theme.colors.bodyText, fontFamily: fonts.body, flexShrink: 1 },
  maritalStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  maritalStatusText: { fontSize: 12, color: theme.colors.gold, fontFamily: fonts.labelBold },
  aboutMeText: {
    fontSize: 13,
    color: theme.colors.bodyText,
    fontFamily: fonts.bodyItalic,
    lineHeight: 19,
    marginBottom: 12,
  },
  biodataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.sand,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  biodataItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  biodataDivider: { width: 1, height: 32, backgroundColor: theme.colors.cardBorder, marginHorizontal: 10 },
  biodataTextCol: { flex: 1 },
  biodataLabel: { fontSize: 11, color: theme.colors.bodyText, fontFamily: 'Georgia', fontWeight: '600' },
  biodataValue: { fontSize: 13, color: theme.colors.text, fontFamily: 'Georgia', fontWeight: '700', marginTop: 1 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
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
    color: theme.colors.text,
    marginBottom: 14,
    fontFamily: 'Georgia',
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.ink,
    marginBottom: 6,
  },
  filterInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.invitationCard,
    paddingHorizontal: 12,
    fontSize: 13,
    color: theme.colors.text,
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
