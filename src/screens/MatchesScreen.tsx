import React, { useState } from 'react';
import { FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileCard } from '../components/common/ProfileCard';
import { FilterSheet } from '../components/common/FilterSheet';
import { theme } from '../theme';

const mockProfiles = [
  { id: '1', name: 'Amina', age: 27, location: 'Peshawar', education: 'MBA', compatibility: 94 },
  { id: '2', name: 'Zara', age: 25, location: 'Islamabad', education: 'Software Engineer', compatibility: 89 },
  { id: '3', name: 'Sara', age: 29, location: 'Karachi', education: 'Doctor', compatibility: 91 },
  { id: '4', name: 'Nadia', age: 26, location: 'Lahore', education: 'Teacher', compatibility: 87 },
];

export function MatchesScreen({ navigation }: any) {
  const [filterVisible, setFilterVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <FilterSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Matches</Text>
          <Text style={styles.subtitle}>Refined profiles ready for your review.</Text>
        </View>
        <Pressable style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Text style={styles.filterLabel}>Filters</Text>
        </Pressable>
      </View>

      <FlatList
        data={mockProfiles}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProfileCard
            name={item.name}
            age={item.age}
            location={item.location}
            education={item.education}
            compatibility={item.compatibility}
            onPress={() => navigation.navigate('ProfileDetail', { profile: item })}
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
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 18,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 6,
    maxWidth: '70%',
  },
  filterButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 28,
  },
});
