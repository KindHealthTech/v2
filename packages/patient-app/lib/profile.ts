import { useQuery } from '@tanstack/react-query';
import { supabase, PatientProfile as SharedPatientProfile } from '@kht/shared';

// Extend the PatientProfile type from shared package with additional fields
export interface PatientProfile extends Omit<SharedPatientProfile, 'allergies' | 'medical_history'> {
  full_name: string | null;
  blood_group: string | null;
  allergies: string[] | null;
  medical_conditions: string[] | null;
  profile_completed: boolean;
}

export interface ProfileCheckResult {
  needsOnboarding: boolean;
  userProfile?: PatientProfile;
}

// Re-export the shared supabase client
export { supabase };

/**
 * Check if a patient profile exists and is complete
 */
export const checkProfileCompletion = async (userId: string): Promise<ProfileCheckResult> => {
  try {
    console.log('[checkProfileCompletion] Checking patient profile for user:', userId);
    
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If we got a 'no rows found' error, it means the profile doesn't exist
      if (error.code === 'PGRST116') {
        console.log('[checkProfileCompletion] No patient profile found, needs onboarding');
        
        // Check if the user exists in the users table first
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (userError) {
          console.error('[checkProfileCompletion] User does not exist in users table:', userError);
          console.log('[checkProfileCompletion] The user must be created in the users table before creating a profile');
          return { needsOnboarding: true };
        }
        
        // User exists, so let's try to create a profile
        // We won't add a full_name here since it's required and should be provided by the user
        // The form validation will ensure the user provides a name
        console.log('[checkProfileCompletion] User exists, will create profile during onboarding');
        
        return { needsOnboarding: true };
      }
      throw error;
    }
    
    // Check if the profile is complete
    const profileNeedsCompletion = !data.profile_completed;
    console.log('[checkProfileCompletion] Patient profile found:', { 
      profileNeedsCompletion, 
      profileId: data.id,
      isComplete: data.profile_completed 
    });
    
    // Return the actual onboarding status based on profile completion
    console.log('[checkProfileCompletion] Setting onboarding based on profile completion:', {
      userId,
      hasProfile: true,
      profileCompleted: data.profile_completed,
      needsOnboarding: profileNeedsCompletion,
      timestamp: new Date().toISOString()
    });
    return { needsOnboarding: profileNeedsCompletion, userProfile: data };
  } catch (error) {
    console.error('[checkProfileCompletion] Patient profile check failed:', error);
    return { needsOnboarding: true };
  }
};

/**
 * Update a patient profile with new information
 */
export const updatePatientProfile = async (
  userId: string, 
  profileData: Partial<Omit<PatientProfile, 'id' | 'created_at' | 'profile_completed'>>
) => {
  console.log('[updatePatientProfile] Updating profile for user:', userId, profileData);
  
  try {
    const { data, error } = await supabase
      .from('patient_profiles')
      .update(profileData)
      .eq('id', userId)
      .select();
      
    if (error) throw error;
    
    console.log('[updatePatientProfile] Profile updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('[updatePatientProfile] Error updating profile:', error);
    return { data: null, error };
  }
};

/**
 * Mark a patient profile as complete
 */
export const markProfileComplete = async (userId: string) => {
  console.log('[markProfileComplete] Marking profile as complete for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('patient_profiles')
      .update({ profile_completed: true })
      .eq('id', userId)
      .select();
      
    if (error) throw error;
    
    console.log('[markProfileComplete] Profile marked as complete');
    return { data, error: null };
  } catch (error) {
    console.error('[markProfileComplete] Error marking profile as complete:', error);
    return { data: null, error };
  }
};

/**
 * Get a patient profile by user ID
 */
export const getPatientProfile = async (userId: string) => {
  console.log('[getPatientProfile] Getting profile for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('[getPatientProfile] Error getting profile:', error);
    return { data: null, error };
  }
};

/**
 * React Query hook to fetch patient profile
 */
export const usePatientProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['patientProfile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await getPatientProfile(userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
