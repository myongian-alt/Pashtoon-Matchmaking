import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { savePushToken } from './database';

// NOTE ON LIMITATIONS:
// - Expo Go (SDK 53+) no longer supports receiving remote push notifications
//   on Android or iOS. This registration flow will only obtain a real,
//   deliverable token inside an EAS development or production build.
// - Getting a token also requires a configured EAS project ID
//   (app.json -> expo.extra.eas.projectId, set by `eas init`) - now present,
//   but still needs a real EAS development/production build (not Expo Go)
//   to actually receive a deliverable token.
// - This module only handles the client-side registration half. Actually
//   sending a push (e.g. from the notify_on_like/match/message triggers in
//   migration 005) requires a server-side sender - typically a Supabase Edge
//   Function invoked by a `pg_net`/webhook trigger that POSTs to Expo's push
//   API with the tokens stored in public.push_tokens (migration 022).

Notifications.setNotificationHandler({
  // shouldShowBanner/shouldShowList replace the older shouldShowAlert as of
  // a newer expo-notifications version - both control foreground display
  // (banner = transient overlay, list = notification center entry).
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    await savePushToken(userId, expoPushToken, Platform.OS);
    return expoPushToken;
  } catch (error) {
    return null;
  }
}
