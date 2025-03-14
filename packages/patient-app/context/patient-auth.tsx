import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@kht/shared';
import { PatientProfile, checkProfileCompletion } from '../lib/profile';

// Auth state interface
export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// Patient state interface
export interface PatientState {
  needsOnboarding: boolean;
  patientProfile: PatientProfile | null;
  profileLoading: boolean;
  user: User | null;
}

// Patient-specific auth context interface
interface PatientAuthContextType extends AuthState {
  needsOnboarding: boolean;
  patientProfile: PatientProfile | null;
  profileLoading: boolean;
  patientState: PatientState;
}

// Create the patient auth context with default values
const PatientAuthContext = createContext<PatientAuthContextType>({
  ...({} as AuthState), // We'll get these values from the shared auth context
  needsOnboarding: false,
  patientProfile: null,
  profileLoading: true,
  patientState: {
    needsOnboarding: false,
    patientProfile: null,
    profileLoading: true,
    user: null
  }
});

// Define props for the patient auth provider
interface PatientAuthProviderProps {
  children: ReactNode;
}

// Patient Auth Provider - handles auth state and profile checks
export function PatientAuthProvider({ children }: PatientAuthProviderProps) {
  const [patientState, setPatientState] = useState({
    needsOnboarding: false,
    patientProfile: null as PatientProfile | null,
    profileLoading: true,
  });

  // Base auth state
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  });

  // Handle profile checks based on auth state
  const checkPatientProfile = async () => {
    console.log('[PatientAuthProvider] Auth state changed:', { 
      hasUser: !!authState.user, 
      hasSession: !!authState.session,
      isLoading: authState.loading
    });

    // Reset patient state if not authenticated
    if (!authState.user) {
      console.log('[PatientAuthProvider] No user, resetting patient state');
      setPatientState({
        needsOnboarding: false,
        patientProfile: null,
        profileLoading: false,
      });
      return;
    }

    // If authenticated, check profile completion
    try {
      console.log('[PatientAuthProvider] Checking profile completion for user:', authState.user.id);
      setPatientState(prev => ({ ...prev, profileLoading: true }));
      const { needsOnboarding, userProfile } = await checkProfileCompletion(authState.user!.id);
      
      console.log('[PatientAuthProvider] Profile check result:', { 
        needsOnboarding, 
        hasProfile: !!userProfile,
        userId: authState.user.id 
      });
      
      // Update the patient state based on actual profile check
      console.log('[PatientAuthProvider] Setting onboarding flag based on profile check:', {
        needsOnboarding,
        hasProfile: !!userProfile,
        timestamp: new Date().toISOString()
      });
      setPatientState({
        needsOnboarding, // Use the actual value from profile check
        patientProfile: userProfile || null,
        profileLoading: false,
      });
    } catch (error) {
      console.error('[PatientAuthProvider] Error checking profile completion:', error);
      setPatientState({
        needsOnboarding: true,
        patientProfile: null,
        profileLoading: false,
      });
    }
  };

  // Debug the current patient state
  useEffect(() => {
    console.log('[PatientAuthProvider] Current patient state:', { 
      needsOnboarding: patientState.needsOnboarding,
      hasProfile: !!patientState.patientProfile,
      profileLoading: patientState.profileLoading 
    });
  }, [patientState]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[PatientAuthProvider] Auth state change event:', event, 'Session:', !!session);
      
      // For easier debugging
      if (session) {
        console.log('[PatientAuthProvider] User authenticated:', {
          userId: session.user.id,
          email: session.user.email,
          phone: session.user.phone
        });
        
        // If this is a sign-in or token refresh event and we have a session, immediately force onboarding
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('[PatientAuthProvider] 🚀 NEW LOGIN DETECTED - Forcing onboarding redirect');
          
          // Create or ensure user exists in the public.users table
          (async () => {
            try {
              // Check if user already exists in the public.users table
              const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('id', session.user.id)
                .single();
                
              if (checkError && checkError.code === 'PGRST116') { // No record found
                console.log('[PatientAuthProvider] Creating new user record in public.users table');
                
                // Create the user record with the role set to 'patient'
                const { data: newUser, error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: session.user.id,
                    phone_number: session.user.phone || '',
                    role: 'patient'
                  })
                  .select();
                  
                if (insertError) {
                  console.error('[PatientAuthProvider] Error creating user record:', insertError);
                } else {
                  console.log('[PatientAuthProvider] User record created successfully:', newUser);
                }
              } else if (existingUser) {
                console.log('[PatientAuthProvider] User already exists in public.users table:', existingUser.id);
              }
            } catch (error) {
              console.error('[PatientAuthProvider] Error checking/creating user record:', error);
            }
          })();
          
          // Set patient state directly to force onboarding
          setPatientState(prev => ({
            ...prev,
            needsOnboarding: true,
            profileLoading: false
          }));
        }
      }
      
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user || null,
        loading: false,
      }));
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[PatientAuthProvider] Initial session check:', { 
        hasSession: !!session, 
        error
      });
      setAuthState({
        session,
        user: session?.user || null,
        loading: false,
        error: error || null,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // When auth state changes, check user profile
  useEffect(() => {
    console.log('[PatientAuthProvider] 🔄 Auth state update detected:', {
      hasUser: !!authState.user,
      userId: authState.user?.id,
      profileLoading: patientState.profileLoading,
      timestamp: new Date().toISOString()
    });
    
    if (authState.user && !patientState.profileLoading) {
      console.log('[PatientAuthProvider] 🔎 Checking patient profile after auth update');
      checkPatientProfile();
    }
  }, [authState.user]);

  // Create a memoized patient state reference to prevent unnecessary rerenders
  const patientStateRef = React.useMemo(() => ({
    ...patientState,
    user: authState.user
  }), [patientState.needsOnboarding, patientState.patientProfile, patientState.profileLoading, authState.user?.id]);
  
  // Combine the auth state with patient state
  const combinedState: PatientAuthContextType = {
    ...authState,
    ...patientState,
    patientState: patientStateRef,
  };

  return (
    <PatientAuthContext.Provider value={combinedState}>
      {children}
    </PatientAuthContext.Provider>
  );
}



// Custom hook to access the patient auth context
export const usePatientAuth = () => useContext(PatientAuthContext);
