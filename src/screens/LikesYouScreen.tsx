import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { getWhoLikedMe, likeProfile } from '../lib/database';

function toAge(dateOfBirth?: string) {
  if (!dateOfBirth) return 0;
  const birthYear = Number(dateOfBirth.slice(0, 4));
  if (!birthYear || Number.isNaN(birthYear)) return 0;
  return Math.max(18, new Date().getFullYear() - birthYear);
}

export function LikesYouScreen({ navigation }: any) {
  const { userId, isGuest } = useUser();
  const [likers, setLikers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidedIds, setDecidedIds] = useState<string[]>([]);

  const loadLikers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getWhoLikedMe(userId);
    if (!result.error) {
      setLikers(result.data || []);
    }
    setDecidedIds([]);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadLikers();
    }, [loadLikers])
  );

  const handleLikeBack = async (likerUserId: string) => {
    setDecidedIds((prev) => [...prev, likerUserId]);
    const result = await likeProfile(likerUserId, 'like');
    if (result.error) {
      setDecidedIds((prev) => prev.filter((id) => id !== likerUserId));
      Alert.alert('Could not save like', 'Please try again.');
      return;
    }
    Alert.alert("It's a match!", 'You can now message each other from the Messages tab.');
  };

  const handlePass = async (likerUserId: string) => {
    setDecidedIds((prev) => [...prev, likerUserId]);
    const result = await likeProfile(likerUserId, 'reject');
    if (result.error) {
      setDecidedIds((prev) => prev.filter((id) => id !== likerUserId));
      Alert.alert('Could not update', 'Please try again.');
    }
  };

  const handleViewProfile = (item: any) => {
    const profile = item.profile || {};
    navigation.navigate('ProfileDetail', {
      profile: {
        id: item.user_id,
        userId: item.user_id,
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

  const visibleLikers = likers.filter((item) => !decidedIds.includes(item.user_id));

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
          </Pressable>
          <Text style={styles.title}>Likes You</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="heart-multiple-outline" size={48} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>Sign in to see who likes you</Text>
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
        <Text style={styles.title}>Likes You</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.headerSummary}>
        <Text style={styles.summaryCount}>{visibleLikers.length} people liked your profile</Text>
        <Text style={styles.summaryHint}>Like them back to unlock a conversation, or pass.</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleLikers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const profile = item.profile || {};
            const age = toAge(profile.date_of_birth);
            const location = [profile.current_city, profile.nationality].filter(Boolean).join(', ') || 'Not set';
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
                </View>
                {profile.about_me ? (
                  <Text style={styles.aboutMe} numberOfLines={2}>{profile.about_me}</Text>
                ) : null}
                <View style={styles.actionsRow}>
                  <Pressable style={styles.passButton} onPress={() => handlePass(item.user_id)}>
                    <MaterialCommunityIcons name="close" size={18} color={theme.colors.primary} />
                    <Text style={styles.passLabel}>Pass</Text>
                  </Pressable>
                  <Pressable style={styles.likeBackButton} onPress={() => handleLikeBack(item.user_id)}>
                    <MaterialCommunityIcons name="heart" size={18} color="#FFFFFF" />
                    <Text style={styles.likeBackLabel}>Like Back</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="heart-multiple-outline" size={48} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No likes yet</Text>
              <Text style={styles.emptySubtitle}>
                When someone likes your profile, they'll show up here.
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
    marginBottom: 10,
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
  aboutMe: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  passButton: {
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
  passLabel: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  likeBackButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  likeBackLabel: {
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
