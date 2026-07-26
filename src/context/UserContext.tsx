import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChange } from '../lib/auth';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileCompletionStatus, setProfileCompletionStatus } from '../lib/database';
import { navigateTo } from '../navigation/navigationRef';

interface UserContextType {
  selectedGender: 'male' | 'female' | null;
  setSelectedGender: (gender: 'male' | 'female') => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  userPhone: string | null;
  setUserPhone: (phone: string | null) => void;
  profileCompleted: boolean;
  setProfileCompleted: (value: boolean) => void;
  paymentCompleted: boolean;
  setPaymentCompleted: (value: boolean) => void;
  userId: string | null;
  supabaseUser: any;
  loading: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

const PROFILE_COMPLETED_KEY_PREFIX = 'profile_completed:';

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const updateProfileCompleted = async (value: boolean, targetUserId?: string | null) => {
    setProfileCompleted(value);

    const storageUserId = targetUserId ?? userId;
    if (!storageUserId) {
      return;
    }

    try {
      await AsyncStorage.setItem(`${PROFILE_COMPLETED_KEY_PREFIX}${storageUserId}`, value ? '1' : '0');
    } catch (error) {
      console.warn('Failed to persist profile completion state:', error);
    }

    try {
      const result = await setProfileCompletionStatus(value);
      if (result.error) {
        console.warn('Failed to persist profile completion in database:', result.error.message);
      }
    } catch (error) {
      console.warn('Failed to persist profile completion in database:', error);
    }
  };

  const hydrateProfileCompleted = async (targetUserId: string) => {
    try {
      const dbResult = await getProfileCompletionStatus(targetUserId);
      if (dbResult.data) {
        const value = Boolean(dbResult.data.profile_completed);
        setProfileCompleted(value);
        await AsyncStorage.setItem(`${PROFILE_COMPLETED_KEY_PREFIX}${targetUserId}`, value ? '1' : '0');
        return;
      }

      const value = await AsyncStorage.getItem(`${PROFILE_COMPLETED_KEY_PREFIX}${targetUserId}`);
      setProfileCompleted(value === '1');
    } catch (error) {
      console.warn('Failed to load profile completion state:', error);
      setProfileCompleted(false);
    }
  };

  // Initialize auth state on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setIsAuthenticated(true);
          setIsGuest(false);
          setUserId(data.session.user.id);
          setSupabaseUser(data.session.user);
          setUserEmail(data.session.user.email || null);
          setUserPhone(data.session.user.phone || null);
          await hydrateProfileCompleted(data.session.user.id);
        } else {
          setIsAuthenticated(false);
          setIsGuest(true);
          setProfileCompleted(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const subscription = onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setIsAuthenticated(true);
          setIsGuest(false);
          setUserId(session.user.id);
          setSupabaseUser(session.user);
          setUserEmail(session.user.email || null);
          setUserPhone(session.user.phone || null);
          hydrateProfileCompleted(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsGuest(true);
        setUserId(null);
        setSupabaseUser(null);
        setUserEmail(null);
        setUserPhone(null);
        setProfileCompleted(false);
        setPaymentCompleted(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        // Fires when a password-recovery link is opened (web only - the SDK
        // reads the tokens out of the URL itself via detectSessionInUrl in
        // supabase.ts; native recovery links are handled by authDeepLink.ts,
        // which navigates directly since setSession() there only ever fires
        // SIGNED_IN, never this event).
        if (session?.user) {
          setIsAuthenticated(true);
          setIsGuest(false);
          setUserId(session.user.id);
          setSupabaseUser(session.user);
          setUserEmail(session.user.email || null);
          setUserPhone(session.user.phone || null);
        }
        navigateTo('NewPassword');
      }
      
      setLoading(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <UserContext.Provider value={{
      selectedGender,
      setSelectedGender,
      isAuthenticated,
      setIsAuthenticated,
      isGuest,
      setIsGuest,
      userEmail,
      setUserEmail,
      userPhone,
      setUserPhone,
      profileCompleted,
      setProfileCompleted: (value: boolean) => {
        void updateProfileCompleted(value);
      },
      paymentCompleted,
      setPaymentCompleted,
      userId,
      supabaseUser,
      loading,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
