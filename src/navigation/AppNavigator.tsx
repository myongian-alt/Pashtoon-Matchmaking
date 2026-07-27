import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import DeclarationScreen from '../screens/DeclarationScreen';
import AuthSelectionScreen from '../screens/auth/AuthSelectionScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import EmailAuthScreen from '../screens/auth/EmailAuthScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import NewPasswordScreen from '../screens/auth/NewPasswordScreen';
import ChooseGenderScreen from '../screens/ChooseGenderScreen';
import ProfileCompletionScreen from '../screens/profile/ProfileCompletionScreen';
import ProfileFormScreen from '../screens/profile/ProfileFormScreen';
import PremiumScreen from '../screens/PremiumScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import { ProfileDetailScreen } from '../screens/ProfileDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import { LikesYouScreen } from '../screens/LikesYouScreen';
import { WhoViewedMeScreen } from '../screens/WhoViewedMeScreen';
import TabNavigator from './TabNavigator';
import { NotificationsProvider } from '../context/NotificationsContext';
import { UserProvider, useUser } from '../context/UserContext';
import { FormProvider, useForm } from '../context/FormContext';
import { getProfile, getProfilePhotos, mapProfileRowToFormSnapshot } from '../lib/database';
import { registerForPushNotificationsAsync } from '../lib/pushNotifications';
import { initAuthDeepLinkHandling } from '../lib/authDeepLink';
import { navigationRef, flushPendingNavigation } from './navigationRef';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Declaration: undefined;
  ChooseGender: undefined;
  AuthSelection: undefined;
  EmailAuth: undefined;
  PhoneAuth: undefined;
  OtpVerification: { phone: string; gender?: 'male' | 'female' };
  NewPassword: undefined;
  ProfileCompletion: undefined;
  ProfileForm: undefined;
  Tabs: undefined;
  Premium: undefined;
  PaymentSuccess: undefined;
  Chat: { conversationId: string; counterpartName: string; counterpartUserId?: string };
  LikesYou: undefined;
  WhoViewedMe: undefined;
  ProfileDetail: { profile: {
    id: string;
    userId?: string;
    name: string;
    age?: number;
    gender?: string;
    location?: string;
    education?: string;
    profession?: string;
    maritalStatus?: string;
    nationality?: string;
    cityOfBirth?: string;
    currentCity?: string;
    height?: string;
    bodyType?: string;
    aboutMe?: string;
    lifestyle?: string;
    values?: string;
    personality?: string;
    image?: any;
    galleryPhotos?: string[];
    compatibility?: number;
    isSelfProfile?: boolean;
  } };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Loads the signed-in user's saved profile (and photos) from Supabase into
 * FormContext once per session, so ProfileForm/HomeScreen show existing data
 * instead of always starting from a blank form. Sits inside both FormProvider
 * and UserProvider so it can read auth state and write form state.
 */
function ProfileHydrationBridge({ children }: { children: React.ReactNode }) {
  const { userId, loading } = useUser();
  const { updateFormData } = useForm();
  const hydratedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !userId || hydratedForUserId.current === userId) {
      return;
    }

    let isMounted = true;

    (async () => {
      const [{ data: profile }, { data: photos }] = await Promise.all([
        getProfile(userId),
        getProfilePhotos(userId),
      ]);

      if (!isMounted) {
        return;
      }

      hydratedForUserId.current = userId;

      if (!profile) {
        return;
      }

      const snapshot = mapProfileRowToFormSnapshot(profile);
      const profilePicture = (photos || []).find((photo: any) => photo.photo_type === 'profile_picture');
      const galleryPhotos = (photos || [])
        .filter((photo: any) => photo.photo_type === 'gallery')
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((photo: any) => photo.photo_url);

      updateFormData({
        ...snapshot,
        profilePhoto: profilePicture?.photo_url || '',
        galleryPhotos,
      });
    })();

    return () => {
      isMounted = false;
    };
  }, [userId, loading, updateFormData]);

  useEffect(() => {
    if (loading || !userId) {
      return;
    }

    registerForPushNotificationsAsync(userId);
  }, [userId, loading]);

  return <>{children}</>;
}

export default function AppNavigator() {
  useEffect(() => {
    return initAuthDeepLinkHandling();
  }, []);

  return (
    <FormProvider>
      <UserProvider>
        <ProfileHydrationBridge>
          <NotificationsProvider>
            <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Declaration" component={DeclarationScreen} />
                <Stack.Screen name="ChooseGender" component={ChooseGenderScreen} />
                <Stack.Screen name="AuthSelection" component={AuthSelectionScreen} />
                <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
                <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
                <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
                <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
                <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
                <Stack.Screen name="ProfileForm" component={ProfileFormScreen} />
                <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
                <Stack.Screen name="Tabs" component={TabNavigator} />
                <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
                <Stack.Screen name="Premium" component={PremiumScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="LikesYou" component={LikesYouScreen} />
                <Stack.Screen name="WhoViewedMe" component={WhoViewedMeScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </NotificationsProvider>
        </ProfileHydrationBridge>
      </UserProvider>
    </FormProvider>
  );
}
