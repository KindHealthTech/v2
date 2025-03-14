import { supabase, Database } from '@kht/shared'
import { useQuery } from '@tanstack/react-query';

// Use the types from the shared package
export type DoctorProfile = Database['public']['Tables']['doctor_profiles']['Row'];

export interface ProfileCheckResult {
  needsOnboarding: boolean;
  userProfile?: DoctorProfile;
}

export const checkProfileCompletion = async (userId: string): Promise<ProfileCheckResult> => {
  try {
    console.log('[checkProfileCompletion] Checking profile for user:', userId);
    
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If we got a 'no rows found' error, it means the profile doesn't exist
      if (error.code === 'PGRST116') {
        console.log('[checkProfileCompletion] No profile found, needs onboarding');
        
        // Create a skeleton profile with is_profile_complete=false
        await supabase
          .from('doctor_profiles')
          .insert({
            id: userId,
            is_profile_complete: false,
          })
          .select();
          
        return { needsOnboarding: true };
      }
      throw error;
    }
    
    const needsOnboarding = !data.is_profile_complete;
    console.log('[checkProfileCompletion] Profile found:', { 
      needsOnboarding, 
      profileId: data.id,
      isComplete: data.is_profile_complete 
    });
    
    return { needsOnboarding, userProfile: data };
  } catch (error) {
    console.error('[checkProfileCompletion] Profile check failed:', error);
    return { needsOnboarding: true };
  }
};

export const updateDoctorProfile = async (
  id: string,
  profile: {
    full_name: string;
    specialization: string;
    qualification: string;
    years_of_experience: number;
  }
) => {
  try {
    console.log('[updateDoctorProfile] Checking for existing profile:', id);
    // First, create the doctor profile if it doesn't exist
    const { data: existingProfile } = await supabase
      .from('doctor_profiles')
      .select()
      .eq('id', id)
      .single();

    if (!existingProfile) {
      console.log('[updateDoctorProfile] Creating new profile');
      // Create new profile with is_profile_complete set to false
      const { data, error } = await supabase
        .from('doctor_profiles')
        .insert({
          id,
          ...profile,
          is_profile_complete: false, // Set to false initially
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }

    console.log('[updateDoctorProfile] Updating existing profile');
    // Update existing profile but don't change is_profile_complete
    const { data, error } = await supabase
      .from('doctor_profiles')
      .update({
        ...profile,
        // Don't update is_profile_complete here
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[updateDoctorProfile] Error:', error);
    return { data: null, error };
  }
};


export const checkDoctorProfile = async (userId: string) => {
  try {
    console.log('[checkDoctorProfile] Checking profile for user:', userId);
    
    const { data: profile, error } = await supabase
      .from('doctor_profiles')
      .select('is_profile_complete')
      .eq('id', userId)
      .single();

    console.log('[checkDoctorProfile] Profile data:', profile);
    console.log('[checkDoctorProfile] Error:', error);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[checkDoctorProfile] Profile not found');
        return false;
      }
      console.error('[checkDoctorProfile] Error checking doctor profile:', error);
      return false;
    }

    const isComplete = profile?.is_profile_complete ?? false;
    console.log('[checkDoctorProfile] Is profile complete?', isComplete);
    return isComplete;
  } catch (error) {
    console.error('[checkDoctorProfile] Caught error:', error);
    return false;
  }
};


export async function getDoctorProfile(userId: string) {
  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data as DoctorProfile;
}



export function useDoctorProfile(userId?: string) {
  return useQuery({
    queryKey: ['doctorProfile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw new Error(error.message);
      return data as DoctorProfile;
    },
    enabled: !!userId
  });
}

