import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const cards = [
  { title: 'Recommended Matches', subtitle: 'Profiles curated for family values.', amount: '24' },
  { title: 'Recently Joined', subtitle: 'Fresh profiles from your region.', amount: '18' },
  { title: 'Verified Profiles', subtitle: 'Profiles with trusted verification.', amount: '12' },
];

const statistics = [
  { label: 'Profile Strength', value: '78%' },
  { label: 'Liked you', value: '14' },
  { label: 'People matched', value: '6' },
  { label: 'Saved profiles', value: '9' },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
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

      <FlatList
        data={cards}
        keyExtractor={(item) => item.title}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsList}
        renderItem={({ item }) => (
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>{item.title}</Text>
            <Text style={styles.statSubtitle}>{item.subtitle}</Text>
            <Text style={styles.statAmount}>{item.amount}</Text>
          </View>
        )}
      />

      <View style={styles.premiumBanner}>
        <Text style={styles.premiumTitle}>Upgrade for full access</Text>
        <Text style={styles.premiumCaption}>Unlock premium to connect, reveal contact details, and access unlimited filters.</Text>
        <Pressable style={styles.premiumButton} onPress={() => navigation.navigate('Premium' as never)}>
          <Text style={styles.premiumButtonText}>Go Premium</Text>
        </Pressable>
      </View>

      <View style={styles.browseSection}>
        <Text style={styles.browseTitle}>Ready to discover matches?</Text>
        <Pressable style={styles.browseButton} onPress={() => navigation.navigate('Matches' as never)}>
          <Text style={styles.browseButtonText}>Browse Matches</Text>
        </Pressable>
      </View>

      <View style={styles.statsSection}>
        {statistics.map((stat) => (
          <View key={stat.label} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
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
});
