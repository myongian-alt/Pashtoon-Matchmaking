import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function ProfileDetailScreen({ route, navigation }: any) {
  const profile = route.params?.profile;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageLabel}>Profile</Text>
        </View>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            <Text style={styles.location}>{profile.location}</Text>
          </View>
          <Text style={styles.matchBadge}>{profile.compatibility}% Match</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About her</Text>
          <Text style={styles.sectionText}>A confident professional committed to family values and a blessed marriage. Seeks a partner with strong character, ambition, and respect for tradition.</Text>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.education}</Text>
            <Text style={styles.statLabel}>Profession</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.age} yrs</Text>
            <Text style={styles.statLabel}>Age</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family & Lifestyle</Text>
          <Text style={styles.sectionText}>Belongs to a supportive family, values health and balanced living. Open to travel, education, and faith-centered companionship.</Text>
        </View>

        <Pressable style={styles.actionButton} onPress={() => navigation.goBack()}>
          <Text style={styles.actionLabel}>Send Interest</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 28,
    marginBottom: 22,
    backgroundColor: theme.colors.surfaceSoft,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  location: {
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  matchBadge: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: theme.colors.surfaceSoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionText: {
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    marginRight: 10,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  statLabel: {
    color: theme.colors.textSecondary,
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: 28,
    backgroundColor: theme.colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  imageLabel: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
