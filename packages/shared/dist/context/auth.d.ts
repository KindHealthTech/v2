import React, { ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
export type UserRole = 'doctor' | 'patient';
export interface AuthState {
    session: Session | null;
    user: User | null;
    loading: boolean;
    isNewUser: boolean;
    userRole: UserRole | null;
    dbUser: Database['public']['Tables']['users']['Row'] | null;
}
export interface AuthContextType extends AuthState {
    signIn: (phone: string) => Promise<{
        error: Error | null;
    }>;
    signOut: () => Promise<{
        error: Error | null;
    }>;
    verifyOTP: (phone: string, token: string) => Promise<{
        error: Error | null;
        session: Session | null;
    }>;
}
interface AuthProviderProps {
    children: ReactNode;
    onAuthStateChange?: (state: AuthState) => void;
}
export declare function AuthProvider({ children, onAuthStateChange }: AuthProviderProps): React.JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};
