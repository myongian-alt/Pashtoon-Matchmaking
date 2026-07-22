import React from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNotifications } from '../context/NotificationsContext';
import { theme } from '../theme';

export function NotificationsScreen() {
  const { notifications, markAsRead, markAllRead } = useNotifications();
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Stay updated on interests, matches, and premium perks.</Text>
        <Text style={styles.unreadSummary}>{unreadCount} unread</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.notificationCard, item.unread && styles.notificationCardUnread]}>
            <View style={styles.notificationRow}>
              <View>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationSubtitle}>{item.subtitle}</Text>
              </View>
              {item.unread && <View style={styles.unreadDot} />}
            </View>
            {item.unread && (
              <Pressable style={styles.markReadButton} onPress={() => markAsRead(item.id)}>
                <Text style={styles.markReadText}>Mark as read</Text>
              </Pressable>
            )}
          </View>
        )}
      />

      <Pressable style={styles.markAllButton} onPress={markAllRead}>
        <Text style={styles.markAllText}>Mark all read</Text>
      </Pressable>
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
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  unreadSummary: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: 10,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  notificationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notificationCardUnread: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F5FBF7',
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  unreadDot: {
    width: 12,
    height: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    marginLeft: 12,
    marginTop: 6,
  },
  notificationTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  notificationSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  markReadButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  markReadText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  markAllButton: {
    textAlign: 'center',
    marginVertical: 20,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  markAllText: {
    color: theme.colors.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
});
