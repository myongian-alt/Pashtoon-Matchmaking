import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// EXPO_PUBLIC_ vars are inlined into the client bundle by Expo automatically
// (built into the SDK, no extra babel/dotenv plugin needed) - this is the
// anon/publishable key, designed by Supabase to be public and safe to ship;
// Row Level Security, not secrecy of this key, is the actual access boundary.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY - check .env (see .env.example).'
  );
}

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web this lets the SDK read the access/refresh tokens straight out of
    // window.location when a password-recovery link is opened (fires a
    // PASSWORD_RECOVERY auth event - see UserContext). There's no
    // window.location on native, so it's left off there; native recovery
    // links are instead handled by authDeepLink.ts via expo-linking.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Type exports for database schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          gender_preference: 'male' | 'female' | 'other';
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          gender_preference: 'male' | 'female' | 'other';
          is_active?: boolean;
        };
        Update: {
          email?: string | null;
          phone?: string | null;
          gender_preference?: 'male' | 'female' | 'other';
          is_active?: boolean;
          last_login?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          date_of_birth: string;
          marital_status: string;
          current_city: string;
          about_me: string | null;
          is_verified: boolean;
          profile_strength_percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name: string;
          date_of_birth: string;
          marital_status: string;
          current_city: string;
          about_me?: string | null;
        };
        Update: {
          full_name?: string;
          current_city?: string;
          about_me?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: 'active' | 'expired' | 'cancelled';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          status: 'active' | 'expired' | 'cancelled';
          expires_at: string;
        };
        Update: {
          status?: 'active' | 'expired' | 'cancelled';
          expires_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          source_user_id: string | null;
          notification_type: string;
          title: string;
          subtitle: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          notification_type: string;
          title: string;
          subtitle?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          message_text: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          message_text: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
    };
  };
};
