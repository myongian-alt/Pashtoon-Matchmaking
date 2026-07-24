import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ngohyujweyxmrbbusufa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xoyTFJL0efZXmPeIjoxhBg_GPofmZ-3';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
