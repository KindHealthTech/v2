// Export shared components and utilities
export * from './components';
export * from './hooks';
export * from './constants';

// Export Supabase client
export { supabase } from './lib/supabase';

// Export Supabase types
export * from './types/supabase';

// Export Auth module
export { AuthProvider, useAuth, type UserRole, type AuthState, type AuthContextType } from './context/auth';
