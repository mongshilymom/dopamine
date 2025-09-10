import { createClient } from '@supabase/supabase-js';
import type { Database } from './database-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with enhanced configuration for ADHD-friendly UX
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable anonymous sign-ins for privacy-conscious users
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Reduce auth complexity for ADHD users
    flowType: 'implicit'
  },
  // Optimize for responsiveness (important for ADHD users)
  db: {
    schema: 'public'
  },
  realtime: {
    // Disable realtime for MVP to reduce cognitive load
    params: {
      eventsPerSecond: 1
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'focus-nexus-mvp'
    }
  }
});

// Helper function for anonymous authentication
export const signInAnonymously = async () => {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('Anonymous sign-in failed:', error);
      return { user: null, error };
    }

    // Create profile for new anonymous user
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          display_name: 'Focus User',
          allow_anonymous_analytics: true
        });

      if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
        console.warn('Profile creation failed:', profileError);
      }
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('Unexpected error in anonymous sign-in:', error);
    return { user: null, error: error as Error };
  }
};

// Helper function to track events with privacy compliance
export const trackEvent = async (
  eventType: string, 
  eventCategory: string, 
  eventData: Record<string, any> = {},
  sessionId?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Cannot track event: No authenticated user');
      return;
    }

    // Get user profile for analytics consent
    const { data: profile } = await supabase
      .from('profiles')
      .select('allow_anonymous_analytics')
      .eq('id', user.id)
      .single();

    // Respect user privacy preferences
    if (!profile?.allow_anonymous_analytics) {
      return;
    }

    const { error } = await supabase.from('events').insert({
      user_id: user.id,
      event_type: eventType,
      event_category: eventCategory,
      event_data: eventData,
      session_id: sessionId,
      user_agent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      local_time: new Date().toISOString(),
      is_anonymous: user.is_anonymous || false
    });

    if (error) {
      console.error('Event tracking failed:', error);
    }
  } catch (error) {
    console.error('Unexpected error in event tracking:', error);
  }
};

// Helper function for since-wake statistics
export const getSinceWakeStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_since_wake_stats');

    if (error) {
      console.error('Failed to get since-wake stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error getting stats:', error);
    return null;
  }
};

// Type definitions for better TypeScript support
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];
