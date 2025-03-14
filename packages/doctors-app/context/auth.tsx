import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User } from '@kht/shared';
import { getCurrentUser } from '../lib/users';
import { checkProfileCompletion } from '../lib/profile';

type AuthContextType = {
  user: (User & { id: string }) | null;
  loading: boolean;
  needsOnboarding: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  needsOnboarding: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Get initial user
    getCurrentUser().then(({ data, error }) => {
      if (error) {
        console.error('Error getting current user:', error);
        return;
      }
      if (data?.auth.id) {
        setUser(data.auth);
        checkProfileCompletion(data.auth.id).then(({ needsOnboarding }) => {
          setNeedsOnboarding(needsOnboarding);
          setIsNewUser(data.isNewUser)
        });
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: user, error } = await getCurrentUser();
        if (error) {
          console.error('Error getting current user:', error);
          return;
        }
        if(!user?.auth.id) return;
        setUser(user?.auth);
        checkProfileCompletion(user?.auth.id).then(({ needsOnboarding }) => {
          setNeedsOnboarding(needsOnboarding);
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, needsOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
