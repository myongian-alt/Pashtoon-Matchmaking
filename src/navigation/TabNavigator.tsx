import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileDiscoveryScreen from '../screens/ProfileDiscoveryScreen';
import HomeScreen from '../screens/HomeScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { theme } from '../theme';
import { useNotifications } from '../context/NotificationsContext';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';

          if (route.name === 'Discover') iconName = 'cards-heart';
          if (route.name === 'Home') iconName = 'home';
          if (route.name === 'Matches') iconName = 'account-multiple';
          if (route.name === 'Favorites') iconName = 'heart';
          if (route.name === 'Notifications') iconName = 'bell';

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Discover" component={ProfileDiscoveryScreen} options={{ tabBarLabel: 'Discover' }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ tabBarLabel: 'Matches' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Favorites' }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: unreadCount || undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary,
            color: '#fff',
          },
        }}
      />
    </Tab.Navigator>
  );
}
