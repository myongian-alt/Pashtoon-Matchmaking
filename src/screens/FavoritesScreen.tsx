import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ProfileCard } from '../components/common/ProfileCard';
import { theme } from '../theme';

const favorites = [
  { id: '1', name: 'Hira', age: 28, location: 'Quetta', education: 'Teacher', compatibility: 92 },
  { id: '2', name: 'Sania', age: 26, location: 'Faisalabad', education: 'Accountant', compatibility: 88 },
];

export function FavoritesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <View style={styles.headerSummary}>
          <Text style={styles.summaryCount}>{favorites.length} saved profiles</Text>
          <Text style={styles.summaryHint}>Your premium matches are highlighted for quick review.</Text>
        </View>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProfileCard
            name={item.name}
            age={item.age}
            location={item.location}
            education={item.education}
            compatibility={item.compatibility}
            tag="Favorite"
            actionLabel="Open"
            onPress={() => navigation.navigate('ProfileDetail', { profile: item })}
            onSecondaryPress={() => {}}
          />
        )}
      />
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
});
