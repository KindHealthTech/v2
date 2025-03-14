import { supabase, Database } from '@kht/shared';

// Use the User type from the shared package
export type DatabaseUser = Database['public']['Tables']['users']['Row'];

export const checkNewUser = async (userId: string) => {
  const { data, error } = await getDatabaseUser(userId);
  
  if (error?.code === 'PGRST116') { // No rows found
    return { isNewUser: true, data: null };
  }
  return { isNewUser: false, data, error };
};

export const createNewUser = async (userId: string, phoneNumber: string, role: string) => {
  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, phone_number: phoneNumber , role: role})
    .select()

  return { data, error };
}

export const getDatabaseUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { data: null, error };

  const { isNewUser, data: dbUser } = await checkNewUser(user.id);
  
  return { 
    data: { 
      auth: user, 
      database: dbUser,
      isNewUser
    }, 
    error: null 
  };
};
