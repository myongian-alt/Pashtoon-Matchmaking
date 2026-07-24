import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChange } from '../lib/auth';
import { supabase } from '../lib/supabase';

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
        } else {
          setIsAuthenticated(false);
          setIsGuest(true);
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
      setProfileCompleted,
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
