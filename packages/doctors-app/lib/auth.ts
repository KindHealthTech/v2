import { supabase } from '@kht/shared'

export const signInWithPhone = async (phone: string) => {
  return supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true }
  });
};

export const verifyOTP = async (phone: string, token: string) => {
  return supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  });
};


export const signOut = async () => {
  return await supabase.auth.signOut();
};
