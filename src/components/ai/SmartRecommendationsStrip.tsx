import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { SmartMatchRecommendation } from '../../lib/aiCoach';
import { ModernMuslimAvatar } from '../common/ModernMuslimAvatar';

type SmartRecommendationsStripProps = {
  recommendations: SmartMatchRecommendation[];
  onOpenProfile: (recommendation: SmartMatchRecommendation) => void;
};

export function SmartRecommendationsStrip({ recommendations, onOpenProfile }: SmartRecommendationsStripProps) {
  if (!recommendations.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="robot-excited-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.title}>Smart Recommendations</Text>
      </View>
      <Text style={styles.subtitle}>Handpicked profiles with one quick reason</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {recommendations.map((item) => (
          <Pressable key={item.profileId} style={styles.itemCard} onPress={() => onOpenProfile(item)}>
            <View style={styles.avatarWrap}>
              {item.image ? (
                <Image source={item.image} style={styles.avatarImage} />
              ) : (
                <ModernMuslimAvatar gender={item.gender} size={68} />
              )}
            </View>

            <Text style={styles.name} numberOfLines={1}>{item.name}, {item.age || '--'}</Text>
            <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
            <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.score}>{item.score}% fit</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.primary} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF5E5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECD9BF',
    padding: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#1F2924',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Georgia',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  row: {
    gap: 10,
    paddingRight: 2,
  },
  itemCard: {
    width: 178,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    padding: 10,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    marginBottom: 8,
    alignSelf: 'center',
    backgroundColor: '#F7EFE5',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 13,
    color: '#1F2924',
    fontWeight: '800',
    textAlign: 'center',
  },
  location: {
    marginTop: 2,
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  reason: {
    marginTop: 7,
    fontSize: 11,
    color: '#3E4A46',
    lineHeight: 15,
    minHeight: 30,
  },
  footerRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
