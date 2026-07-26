import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { getProfileViewers, likeProfile } from '../lib/database';

function toAge(dateOfBirth?: string) {
  if (!dateOfBirth) return 0;
  const birthYear = Number(dateOfBirth.slice(0, 4));
  if (!birthYear || Number.isNaN(birthYear)) return 0;
  return Math.max(18, new Date().getFullYear() - birthYear);
}

function formatViewedAt(isoString: string) {
  const viewedDate = new Date(isoString);
  const diffMs = Date.now() - viewedDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return viewedDate.toLocaleDateString();
}

export function WhoViewedMeScreen({ navigation }: any) {
  const { userId, isGuest } = useUser();
  const [viewers, setViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const loadViewers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getProfileViewers(userId);
    if (!result.error) {
      setViewers(result.data || []);
    }
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadViewers();
    }, [loadViewers])
  );

  const handleLike = async (viewerId: string) => {
    setLikedIds((prev) => [...prev, viewerId]);
    const result = await likeProfile(viewerId, 'like');
    if (result.error) {
      setLikedIds((prev) => prev.filter((id) => id !== viewerId));
      Alert.alert('Could not save like', 'Please try again.');
      return;
    }
    Alert.alert('Liked', 'If they like you back, a match will appear in Messages.');
  };

  const handleViewProfile = (item: any) => {
    const profile = item.profile || {};
    navigation.navigate('ProfileDetail', {
      profile: {
        id: item.viewer_id,
        userId: item.viewer_id,
        name: profile.full_name || 'Unnamed profile',
        age: toAge(profile.date_of_birth),
        currentCity: profile.current_city,
        nationality: profile.nationality,
        location: [profile.current_city, profile.nationality].filter(Boolean).join(', ') || 'Not set',
        aboutMe: profile.about_me || '',
        image: profile.profile_photos?.[0]?.photo_url ? { uri: profile.profile_photos[0].photo_url } : null,
      },
    });
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
          </Pressable>
          <Text style={styles.title}>Who Viewed Me</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="eye-outline" size={48} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>Sign in to see your profile visitors</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.title}>Who Viewed Me</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.headerSummary}>
        <Text style={styles.summaryCount}>{viewers.length} profile visits</Text>
        <Text style={styles.summaryHint}>See who's checked out your profile recently.</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={viewers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const profile = item.profile || {};
            const age = toAge(profile.date_of_birth);
            const location = [profile.current_city, profile.nationality].filter(Boolean).join(', ') || 'Not set';
            const isLiked = likedIds.includes(item.viewer_id);
            return (
              <Pressable style={styles.card} onPress={() => handleViewProfile(item)}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <MaterialCommunityIcons name="account" size={30} color={theme.colors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{profile.full_name || 'Unnamed profile'}{age ? `, ${age}` : ''}</Text>
                    <Text style={styles.location}>{location}</Text>
                  </View>
                  <Text style={styles.viewedAt}>{formatViewedAt(item.viewed_at)}</Text>
                </View>
                <View style={styles.actionsRow}>
                  <Pressable style={styles.viewButton} onPress={() => handleViewProfile(item)}>
                    <MaterialCommunityIcons name="eye" size={18} color={theme.colors.primary} />
                    <Text style={styles.viewLabel}>View Profile</Text>
                  </Pressable>
                  <Pressable
                    style={styles.likeButton}
                    onPress={() => handleLike(item.viewer_id)}
                    disabled={isLiked}
                  >
                    <MaterialCommunityIcons name="heart" size={18} color="#FFFFFF" />
                    <Text style={styles.likeLabel}>{isLiked ? 'Liked' : 'Like'}</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="eye-outline" size={48} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No profile visits yet</Text>
              <Text style={styles.emptySubtitle}>
                When someone views your profile, they'll show up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 28,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSummary: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 4,
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  summaryHint: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  location: {
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  viewedAt: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    alignSelf: 'flex-start',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  likeButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  likeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
