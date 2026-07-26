import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useForm } from '../context/FormContext';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { buildSelfProfileFromForm } from '../lib/selfProfile';
import { getWhoLikedMe, getMatches, getShortlistedProfiles, getProfileViewers } from '../lib/database';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const cards = [
  { title: 'Recommended Matches', subtitle: 'Profiles curated for family values.', amount: '24' },
  { title: 'Recently Joined', subtitle: 'Fresh profiles from your region.', amount: '18' },
  { title: 'Verified Profiles', subtitle: 'Profiles with trusted verification.', amount: '12' },
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { formData } = useForm();
  const { profileCompleted, selectedGender, userId, isGuest } = useUser();
  const [likedYouCount, setLikedYouCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [viewedCount, setViewedCount] = useState(0);

  const handleViewMyProfile = () => {
    navigation.navigate('ProfileDetail', { profile: buildSelfProfileFromForm(formData, selectedGender) });
  };

  useFocusEffect(
    useCallback(() => {
      if (!userId || isGuest) {
        return;
      }

      let isMounted = true;

      Promise.all([
        getWhoLikedMe(userId),
        getMatches(userId),
        getShortlistedProfiles(userId),
        getProfileViewers(userId),
      ]).then(([likedResult, matchesResult, savedResult, viewedResult]) => {
        if (!isMounted) return;
        if (!likedResult.error) setLikedYouCount((likedResult.data || []).length);
        if (!matchesResult.error) setMatchedCount((matchesResult.data || []).length);
        if (!savedResult.error) setSavedCount((savedResult.data || []).length);
        if (!viewedResult.error) setViewedCount((viewedResult.data || []).length);
      });

      return () => {
        isMounted = false;
      };
    }, [userId, isGuest])
  );

  const statistics = [
    { label: 'Profile Strength', value: `${Math.round(formData.profileStrength || 0)}%`, onPress: handleViewMyProfile },
    { label: 'Liked you', value: String(likedYouCount), onPress: () => navigation.navigate('LikesYou') },
    { label: 'People matched', value: String(matchedCount), onPress: () => navigation.navigate('Discover' as never) },
    { label: 'Saved profiles', value: String(savedCount), onPress: () => navigation.navigate('Favorites' as never) },
    { label: 'Profile views', value: String(viewedCount), onPress: () => navigation.navigate('WhoViewedMe') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Assalamualaikum,</Text>
          <Text style={styles.welcome}>Welcome to Khpalwali</Text>
        </View>
        <Pressable style={styles.avatar} />
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Search matches</Text>
        <View style={styles.searchInput}>
          <Text style={styles.searchPlaceholder}>Search by name, city, or profession</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsList}
      >
        {cards.map((item) => (
          <View key={item.title} style={styles.statCard}>
            <Text style={styles.statTitle}>{item.title}</Text>
            <Text style={styles.statSubtitle}>{item.subtitle}</Text>
            <Text style={styles.statAmount}>{item.amount}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.premiumBanner}>
        <Text style={styles.premiumTitle}>Upgrade for full access</Text>
        <Text style={styles.premiumCaption}>Unlock premium to connect, reveal contact details, and access unlimited filters.</Text>
        <Pressable style={styles.premiumButton} onPress={() => navigation.navigate('Premium' as never)}>
          <Text style={styles.premiumButtonText}>Go Premium</Text>
        </Pressable>
      </View>

      <View style={styles.profileSetupCard}>
        <Text style={styles.profileSetupTitle}>{profileCompleted ? 'Your profile is ready' : 'Complete your profile'}</Text>
        <Text style={styles.profileSetupCaption}>
          {profileCompleted
            ? 'You can view or edit your profile anytime.'
            : 'Add your photos, personal details, and preferences so matches can find you.'}
        </Text>
        <Pressable
          style={styles.profileSetupButton}
          onPress={() => navigation.navigate(profileCompleted ? 'ProfileForm' : 'ProfileCompletion')}
        >
          <Text style={styles.profileSetupButtonText}>{profileCompleted ? 'Edit My Profile' : 'Start Profile Setup'}</Text>
        </Pressable>
        <Pressable
          style={styles.profilePreviewButton}
          onPress={handleViewMyProfile}
        >
          <Text style={styles.profilePreviewButtonText}>View My Profile</Text>
        </Pressable>
      </View>

      <View style={styles.browseSection}>
        <Text style={styles.browseTitle}>Ready to discover matches?</Text>
        <Pressable style={styles.browseButton} onPress={() => navigation.navigate('Discover' as never)}>
          <Text style={styles.browseButtonText}>Browse Discover</Text>
        </Pressable>
      </View>

      <View style={styles.statsSection}>
        {statistics.map((stat) => (
          <Pressable key={stat.label} style={styles.statRow} onPress={stat.onPress}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  welcome: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
  },
  searchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchLabel: {
    color: theme.colors.muted,
    fontSize: 14,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
  },
  searchPlaceholder: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  cardsList: {
    paddingBottom: 18,
    paddingRight: 6,
  },
  statCard: {
    width: 220,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  statSubtitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statAmount: {
    color: theme.colors.primary,
    fontSize: 36,
    fontWeight: '800',
  },
  statsSection: {
    marginTop: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  browseSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  browseTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  premiumBanner: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  premiumCaption: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  premiumButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileSetupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  profileSetupTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  profileSetupCaption: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  profileSetupButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  profileSetupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profilePreviewButton: {
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  profilePreviewButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
