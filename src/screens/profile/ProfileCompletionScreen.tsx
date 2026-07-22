import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { ProgressBadge } from '../../components/common/ProgressBadge';

const sections = [
  { title: 'Basic Information', progress: 92, missing: ['Add profession'] },
  { title: 'Education & Career', progress: 68, missing: ['Add education', 'Add industry'] },
  { title: 'Lifestyle & Beliefs', progress: 55, missing: ['Add prayer frequency'] },
  { title: 'Family & Preferences', progress: 78, missing: ['Verify phone'] },
];

export default function ProfileCompletionScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>A strong profile helps families connect with confidence.</Text>

      <View style={styles.progressSummary}>
        <Text style={styles.summaryLabel}>Profile Strength</Text>
        <Text style={styles.summaryValue}>78%</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Text style={styles.sectionProgress}>{item.progress}%</Text>
            </View>
            <Text style={styles.sectionHelp}>Missing: {item.missing.join(', ')}</Text>
          </View>
        )}
      />

      <ProgressBadge value={78} label="Profile Strength" />

      <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ProfileForm' as never)}>
        <Text style={styles.actionText}>Review Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  progressSummary: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginBottom: 8,
  },
  summaryValue: {
    color: theme.colors.primary,
    fontSize: 38,
    fontWeight: '800',
  },
  list: {
    paddingBottom: 20,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionProgress: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHelp: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
