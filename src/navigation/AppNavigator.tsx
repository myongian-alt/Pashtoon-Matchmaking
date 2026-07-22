import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthSelectionScreen from '../screens/auth/AuthSelectionScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import EmailAuthScreen from '../screens/auth/EmailAuthScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import ChooseGenderScreen from '../screens/ChooseGenderScreen';
import ProfileCompletionScreen from '../screens/profile/ProfileCompletionScreen';
import ProfileFormScreen from '../screens/profile/ProfileFormScreen';
import PremiumScreen from '../screens/PremiumScreen';
import { ProfileDetailScreen } from '../screens/ProfileDetailScreen';
import TabNavigator from './TabNavigator';
import { NotificationsProvider } from '../context/NotificationsContext';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  ChooseGender: undefined;
  AuthSelection: undefined;
  EmailAuth: undefined;
  PhoneAuth: undefined;
  OtpVerification: undefined;
  ProfileCompletion: undefined;
  ProfileForm: undefined;
  Tabs: undefined;
  Premium: undefined;
  ProfileDetail: { profile: {
    id: string;
    name: string;
    age: number;
    location: string;
    education: string;
    compatibility: number;
  } };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NotificationsProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="ChooseGender" component={ChooseGenderScreen} />
          <Stack.Screen name="AuthSelection" component={AuthSelectionScreen} />
          <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
          <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
          <Stack.Screen name="ProfileForm" component={ProfileFormScreen} />
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
          <Stack.Screen name="Premium" component={PremiumScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NotificationsProvider>
  );
}
