import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

// Define the type for user roles
export type UserRole = 'doctor' | 'patient';

// Auth state interface
export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  userRole: UserRole | null;
  dbUser: Database['public']['Tables']['users']['Row'] | null;
}

// Auth context interface with additional functionality
export interface AuthContextType extends AuthState {
  signIn: (phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  verifyOTP: (phone: string, token: string) => Promise<{ 
    error: Error | null, 
    session: Session | null 
  }>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isNewUser: false,
  userRole: null,
  dbUser: null,
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  verifyOTP: async () => ({ error: null, session: null }),
});

// Define props for the auth provider
interface AuthProviderProps {
  children: ReactNode;
  onAuthStateChange?: (state: AuthState) => void;
}

// Create the auth provider component
export function AuthProvider({ children, onAuthStateChange }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isNewUser: false,
    userRole: null,
    dbUser: null,
  });

  // Helper function to get database user record
  const getDatabaseUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    return { data, error };
  };

  // Helper function to check if user exists in database
  const checkNewUser = async (userId: string) => {
    const { data, error } = await getDatabaseUser(userId);
    
    if (error?.code === 'PGRST116') { // No rows found
      return { isNewUser: true, data: null };
    }
    return { isNewUser: false, data, error };
  };

  // Helper function to create new user record
  const createNewUser = async (userId: string, phoneNumber: string, role: UserRole) => {
    const { data, error } = await supabase
      .from('users')
      .insert({ id: userId, phone_number: phoneNumber, role })
      .select()
      .single();

    return { data, error };
  };

  // Function to load user data
  const loadUserData = async (session: Session | null) => {
    if (!session?.user) {
      setState(s => ({
        ...s,
        session,
        user: null,
        loading: false,
        isNewUser: false,
        userRole: null,
        dbUser: null,
      }));
      return;
    }

    try {
      // Check if user exists in database
      const { isNewUser, data } = await checkNewUser(session.user.id);
      
      setState(s => ({
        ...s,
        session,
        user: session.user,
        loading: false,
        isNewUser,
        userRole: data?.role as UserRole,
        dbUser: data,
      }));

      // Notify parent components of auth state change if callback provided
      if (onAuthStateChange) {
        onAuthStateChange({
          session,
          user: session.user,
          loading: false,
          isNewUser,
          userRole: data?.role as UserRole,
          dbUser: data,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setState(s => ({
        ...s,
        session,
        user: session.user,
        loading: false,
        isNewUser: false,
        userRole: null,
        dbUser: null,
      }));
    }
  };

  // Initialize auth on component mount
  useEffect(() => {
    // Get the initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await loadUserData(session);
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await loadUserData(session);
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with phone number (OTP)
  const signIn = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as Error };
    }
  };

  // Verify OTP token
  const verifyOTP = async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      
      return { 
        session: data.session,
        error,
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { 
        session: null,
        error: error as Error,
      };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error as Error };
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signOut,
    verifyOTP,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access the auth context
export const useAuth = () => useContext(AuthContext);
