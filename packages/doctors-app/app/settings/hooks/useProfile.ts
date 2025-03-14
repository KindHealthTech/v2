import { useAuth } from '@/context/auth';
import { supabase } from '@kht/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface DoctorProfile {
  id: string;
  full_name: string | null;
  specialization: string | null;
  qualification: string | null;
  years_of_experience: number | null;
  hospital_affiliation: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  full_name: string;
  specialization: string;
  qualification: string;
  years_of_experience: number;
  hospital_affiliation: string;
}

export const defaultFormData: ProfileFormData = {
  full_name: '',
  specialization: '',
  qualification: '',
  years_of_experience: 0,
  hospital_affiliation: '',
};

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as DoctorProfile | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (formData: ProfileFormData) => {
      if (!user?.id) throw new Error('No user ID');
      
      const payload = {
        ...formData,
        is_profile_complete: true,
      };

      if (profile) {
        const { data, error } = await supabase
          .from('doctor_profiles')
          .update(payload)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('doctor_profiles')
          .insert({ ...payload, id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['profile', user?.id]
      });
    },
  });
}
