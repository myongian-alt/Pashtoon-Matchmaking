import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

type MainTabName = 'Discover' | 'Home' | 'Favorites' | 'Notifications';

type AppBottomNavProps = {
  activeTab?: MainTabName;
};

const TABS: Array<{ key: MainTabName; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = [
  { key: 'Discover', label: 'Discover', icon: 'cards-heart' },
  { key: 'Home', label: 'Home', icon: 'home' },
  { key: 'Favorites', label: 'Favourite', icon: 'heart' },
  { key: 'Notifications', label: 'Alerts', icon: 'bell' },
];

export function AppBottomNav({ activeTab }: AppBottomNavProps) {
  const navigation = useNavigation<any>();

  const goToTab = (tab: MainTabName) => {
    navigation.navigate('Tabs', { screen: tab });
  };

  return (
    <View style={styles.wrapper}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <Pressable key={tab.key} style={styles.navItem} onPress={() => goToTab(tab.key)}>
            <MaterialCommunityIcons
              name={tab.icon}
              size={22}
              color={isActive ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  navLabelActive: {
    color: theme.colors.primary,
  },
});