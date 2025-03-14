import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthProvider, useAuth, AuthState } from '@kht/shared';
import { checkProfileCompletion, DoctorProfile } from '@/lib/profile';

// Doctor-specific auth context interface
interface DoctorAuthContextType extends AuthState {
  needsOnboarding: boolean;
  doctorProfile: DoctorProfile | null;
  profileLoading: boolean;
}

// Create the doctor auth context with default values
const DoctorAuthContext = createContext<DoctorAuthContextType>({
  ...({} as AuthState), // We'll get these values from the shared auth context
  needsOnboarding: false,
  doctorProfile: null,
  profileLoading: true,
});

// Define props for the doctor auth provider
interface DoctorAuthProviderProps {
  children: ReactNode;
}

// Doctor Auth Provider that wraps the shared auth provider
export function DoctorAuthProvider({ children }: DoctorAuthProviderProps) {
  const [doctorState, setDoctorState] = useState({
    needsOnboarding: false,
    doctorProfile: null as DoctorProfile | null,
    profileLoading: true,
  });

  // Handle auth state changes and check profile completion
  const handleAuthStateChange = async (authState: AuthState) => {
    console.log('[DoctorAuthProvider] Auth state changed:', { 
      hasUser: !!authState.user, 
      hasSession: !!authState.session,
      isLoading: authState.loading
    });

    // Reset doctor state if not authenticated
    if (!authState.user) {
      console.log('[DoctorAuthProvider] No user, resetting doctor state');
      setDoctorState({
        needsOnboarding: false,
        doctorProfile: null,
        profileLoading: false,
      });
      return;
    }

    // If authenticated, check profile completion
    try {
      console.log('[DoctorAuthProvider] Checking profile completion for user:', authState.user.id);
      setDoctorState(prev => ({ ...prev, profileLoading: true }));
      const { needsOnboarding, userProfile } = await checkProfileCompletion(authState.user!.id);
      
      console.log('[DoctorAuthProvider] Profile check result:', { 
        needsOnboarding, 
        hasProfile: !!userProfile,
        userId: authState.user.id 
      });
      
      setDoctorState({
        needsOnboarding,
        doctorProfile: userProfile || null,
        profileLoading: false,
      });
    } catch (error) {
      console.error('[DoctorAuthProvider] Error checking profile completion:', error);
      setDoctorState({
        needsOnboarding: true,
        doctorProfile: null,
        profileLoading: false,
      });
    }
  };

  // Debug the current doctor state
  useEffect(() => {
    console.log('[DoctorAuthProvider] Current doctor state:', { 
      needsOnboarding: doctorState.needsOnboarding,
      hasProfile: !!doctorState.doctorProfile,
      profileLoading: doctorState.profileLoading 
    });
  }, [doctorState]);

  return (
    <AuthProvider onAuthStateChange={handleAuthStateChange}>
      <DoctorAuthContextWrapper doctorState={doctorState}>
        {children}
      </DoctorAuthContextWrapper>
    </AuthProvider>
  );
}

// Internal wrapper component to combine auth state with doctor state
function DoctorAuthContextWrapper({ 
  children, 
  doctorState 
}: { 
  children: ReactNode;
  doctorState: Omit<DoctorAuthContextType, keyof AuthState>;
}) {
  const authState = useAuth();

  // Debug the auth state from the shared provider
  useEffect(() => {
    console.log('[DoctorAuthContextWrapper] Auth state from shared provider:', { 
      hasUser: !!authState.user, 
      hasSession: !!authState.session,
      isLoading: authState.loading 
    });
  }, [authState.user, authState.session, authState.loading]);

  // Combine the shared auth state with doctor-specific state
  const combinedState: DoctorAuthContextType = {
    ...authState,
    ...doctorState,
  };

  return (
    <DoctorAuthContext.Provider value={combinedState}>
      {children}
    </DoctorAuthContext.Provider>
  );
}

// Custom hook to access the doctor auth context
export const useDoctorAuth = () => useContext(DoctorAuthContext);
