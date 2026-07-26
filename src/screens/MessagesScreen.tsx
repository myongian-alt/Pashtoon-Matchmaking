import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getConversations } from '../lib/database';
import { ModernMuslimAvatar } from '../components/common/ModernMuslimAvatar';

type MessagesNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessagesScreen() {
  const navigation = useNavigation<MessagesNavigationProp>();
  const { userId, isGuest } = useUser();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getConversations(userId);
    if (!result.error) {
      setConversations(result.data || []);
    }
    setLoading(false);
  }, [userId]);

  // Reload every time the tab regains focus, so a new match/message shows up
  // without needing to leave and re-enter the app.
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.guestCard}>
          <MaterialCommunityIcons name="chat-outline" size={48} color={theme.colors.primary} />
          <Text style={styles.guestTitle}>Sign in to message your matches</Text>
          <Text style={styles.guestSubtitle}>Guests can browse, but need an account to chat.</Text>
          <Pressable style={styles.guestButton} onPress={() => navigation.navigate('EmailAuth')}>
            <Text style={styles.guestButtonText}>Sign In with Email</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: item.id,
                  counterpartName: item.profile?.full_name || 'Match',
                  counterpartUserId: item.counterpart_user_id,
                })
              }
            >
              <View style={styles.avatarWrap}>
                {item.counterpart_photo_url ? (
                  <Image source={{ uri: item.counterpart_photo_url }} style={styles.avatarImage} />
                ) : (
                  <ModernMuslimAvatar gender={item.counterpart_gender === 'female' ? 'female' : 'male'} size={52} />
                )}
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>{item.profile?.full_name || 'Match'}</Text>
                <Text style={styles.rowPreview} numberOfLines={1}>
                  {item.last_message_preview || 'Say hello to your match!'}
                </Text>
              </View>
              <Text style={styles.rowTime}>{formatTimestamp(item.updated_at)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                When you and someone else both like each other, you'll match and can start chatting here.
              </Text>
            </View>
          }
        />
      )}
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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSoft,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rowPreview: {
    marginTop: 3,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  rowTime: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  guestCard: {
    marginHorizontal: 20,
    marginTop: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  guestTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  guestButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
