import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileCard } from '../components/common/ProfileCard';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { getShortlistedProfiles, removeLike, EDUCATION_LEVEL_DISPLAY } from '../lib/database';

function toAge(dateOfBirth?: string) {
  if (!dateOfBirth) return 0;
  const birthYear = Number(dateOfBirth.slice(0, 4));
  if (!birthYear || Number.isNaN(birthYear)) return 0;
  return Math.max(18, new Date().getFullYear() - birthYear);
}

export function FavoritesScreen({ navigation }: any) {
  const { userId, isGuest } = useUser();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getShortlistedProfiles(userId);
    if (!result.error) {
      setFavorites(result.data || []);
    }
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRemove = async (targetUserId: string) => {
    setFavorites((prev) => prev.filter((item) => item.userId !== targetUserId));
    await removeLike(targetUserId);
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="heart-outline" size={48} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>Sign in to save favorites</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <View style={styles.headerSummary}>
          <Text style={styles.summaryCount}>{favorites.length} saved profiles</Text>
          <Text style={styles.summaryHint}>Profiles you've shortlisted from Discover show up here.</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProfileCard
              name={item.fullName || 'Unnamed profile'}
              age={toAge(item.dateOfBirth)}
              location={[item.currentCity, item.nationality].filter(Boolean).join(', ') || 'Not set'}
              education={EDUCATION_LEVEL_DISPLAY[item.educationLevel] || 'Not set'}
              compatibility={80}
              tag="Favorite"
              actionLabel="Open"
              onPress={() =>
                navigation.navigate('ProfileDetail', {
                  profile: {
                    id: item.userId,
                    userId: item.userId,
                    name: item.fullName || 'Unnamed profile',
                    age: toAge(item.dateOfBirth),
                    gender: item.gender,
                    currentCity: item.currentCity,
                    nationality: item.nationality,
                    education: EDUCATION_LEVEL_DISPLAY[item.educationLevel] || 'Not set',
                    profession: item.profession || 'Not set',
                    location: [item.currentCity, item.nationality].filter(Boolean).join(', ') || 'Not set',
                    image: item.photoUrl ? { uri: item.photoUrl } : null,
                  },
                })
              }
              onSecondaryPress={() => handleRemove(item.userId)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="heart-outline" size={48} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the bookmark icon on a profile in Discover to save it here.
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
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  headerSummary: {
    marginTop: 8,
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
