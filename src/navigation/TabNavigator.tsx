import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileDiscoveryScreen from '../screens/ProfileDiscoveryScreen';
import HomeScreen from '../screens/HomeScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import MessagesScreen from '../screens/MessagesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import AccountScreen from '../screens/AccountScreen';
import { theme } from '../theme';
import { fonts } from '../theme/typography';
import { useNotifications } from '../context/NotificationsContext';

const Tab = createBottomTabNavigator();

const TAB_ACCENT_COLORS: Record<string, string> = {
  Discover: theme.colors.lapis,
  Home: theme.colors.emerald,
  Favorites: theme.colors.pomegranate,
  Messages: theme.colors.lapis,
  Notifications: theme.colors.gold,
  Account: theme.colors.emerald,
};

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
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -3 },
          shadowRadius: 10,
          elevation: 8,
        },
        // Each tab gets its own brand accent when active (matching the
        // per-section colors used throughout the redesign - Discover/Chats
        // lapis, Rishtas/Shortlist pomegranate, etc.) instead of every tab
        // turning the same single color, which read as flat/colourless.
        tabBarActiveTintColor: TAB_ACCENT_COLORS[route.name] || theme.colors.emerald,
        tabBarInactiveTintColor: theme.colors.faintText,
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fonts.labelBold,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';

          if (route.name === 'Discover') iconName = 'cards-heart';
          if (route.name === 'Home') iconName = 'home';
          if (route.name === 'Favorites') iconName = 'heart';
          if (route.name === 'Messages') iconName = 'chat-outline';
          if (route.name === 'Notifications') iconName = 'bell';
          if (route.name === 'Account') iconName = 'account-circle';

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Discover" component={ProfileDiscoveryScreen} options={{ tabBarLabel: 'Discover' }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Shortlist' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: 'Messages' }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: unreadCount || undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.pomegranateBright,
            color: '#fff',
          },
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarLabel: 'Account' }} />
    </Tab.Navigator>
  );
}
