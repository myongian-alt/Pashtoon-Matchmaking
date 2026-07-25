import React, { useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, FlatList, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDiscoveryProfiles, getMatches } from '../lib/database';

type ProfileListItem = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  maritalStatus: string;
  currentCity: string;
  profession?: string;
  location: string;
  image?: any;
  aboutMe?: string;
  compatibility?: number;
  source: 'discover' | 'matches';
};

const fallbackProfiles: ProfileListItem[] = [
  {
    id: 'fallback-1',
    name: 'Ayesha Khan',
    age: 25,
    gender: 'female',
    maritalStatus: 'Never Married',
    currentCity: 'Kabul',
    location: 'Kabul, Afghanistan',
    profession: 'Doctor',
    image: null,
    source: 'discover',
  },
  {
    id: 'fallback-2',
    name: 'Ahmed Khan',
    age: 28,
    gender: 'male',
    maritalStatus: 'Never Married',
    currentCity: 'Peshawar',
    location: 'Peshawar, Pakistan',
    profession: 'Software Engineer',
    image: null,
    source: 'discover',
  },
];

function toDisplayMaritalStatus(value?: string) {
  switch (value) {
    case 'never_married':
      return 'Never Married';
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
    name: row.full_name || 'Unnamed profile',
    age: toAge(row.date_of_birth),
    gender,
    maritalStatus: toDisplayMaritalStatus(row.marital_status),
    currentCity: city || 'Not set',
    profession: row.profession || 'Not set',
    location: [city, country].filter(Boolean).join(', ') || 'Not set',
    image: imageUri ? { uri: imageUri } : null,
    aboutMe: row.about_me || '',
    compatibility: row.match_score || row.profile_strength_percentage || 80,
    source,
  };
}

export default function ProfileDiscoveryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedGender, userId, loading } = useUser();
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [discoverProfiles, setDiscoverProfiles] = useState<ProfileListItem[]>([]);
  const [matchedProfiles, setMatchedProfiles] = useState<ProfileListItem[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [activeMode, setActiveMode] = useState<'discover' | 'matches'>('discover');

  const targetGender = useMemo(() => {
    if (selectedGender === 'male') return 'female';
    if (selectedGender === 'female') return 'male';
    return undefined;
  }, [selectedGender]);

  useEffect(() => {
    let isMounted = true;

    const loadDiscover = async () => {
      if (loading || !userId) {
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
          ? fallbackProfiles.filter((item) => item.gender === targetGender)
          : fallbackProfiles;
        setDiscoverProfiles(genderFiltered);
        setLoadingDiscover(false);
        return;
      }

      setDiscoverProfiles(result.data.map((row: any) => toListItemFromProfile(row, 'discover')));
      setLoadingDiscover(false);
    };

    const loadMatches = async () => {
      if (loading || !userId) {
        return;
      }

      setLoadingMatches(true);
      const result = await getMatches(userId);

      if (!isMounted) {
        return;
      }

      if (result.error || !result.data) {
        setMatchedProfiles([]);
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

      setMatchedProfiles(mapped);
      setLoadingMatches(false);
    };

    loadDiscover();
    loadMatches();

    return () => {
      isMounted = false;
    };
  }, [loading, userId, targetGender]);

  const handleLike = (profileId: string) => {
    setLikedProfiles((prev) => (prev.includes(profileId) ? prev : [...prev, profileId]));
  };

  const handleViewProfile = (profile: ProfileListItem) => {
    navigation.navigate('ProfileDetail', {
      profile,
    });
  };

  const listData = activeMode === 'discover' ? discoverProfiles : matchedProfiles;
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
              <MaterialCommunityIcons
                name={item.gender === 'female' ? 'human-female' : 'human-male'}
                size={72}
                color={theme.colors.primary}
              />
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
              <MaterialCommunityIcons name="briefcase" size={18} color={theme.colors.primary} />
              <Text style={styles.biodataLabel}>Profession</Text>
              <Text style={styles.biodataValue}>{item.profession || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable style={styles.skipButton}>
              <MaterialCommunityIcons name="close" size={20} color={theme.colors.primary} />
              <Text style={styles.buttonLabel}>Skip</Text>
            </Pressable>

            <Pressable style={[styles.likeButton, isLiked && styles.likeButtonActive]} onPress={() => handleLike(item.id)}>
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
        <View style={styles.spacer} />
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
            Matches ({matchedProfiles.length})
          </Text>
        </Pressable>
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
  spacer: { width: 44 },
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
});
