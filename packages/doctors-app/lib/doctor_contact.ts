import { useQuery } from '@tanstack/react-query';
import { supabase, Database } from '@kht/shared';

// Use types from the shared package
export type PatientProfile = Database['public']['Tables']['patient_profiles']['Row'];

export interface Patient {
  id: string;
  patient_profiles: PatientProfile;
}

// For doctor_patient_contacts, define it based on the structure in Supabase
export interface DoctorContact {
  id: string;
  doctor_id: string;
  patient_id: string;
  created_at: string;
  patient: Patient;
}

export function useDoctorContacts(userId?: string) {
  return useQuery({
    queryKey: ['doctorContacts', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('doctor_patient_contacts')
        .select(`
          *,
          patient:patient_id (
            id,
            patient_profiles (*)
          )
        `)
        .eq('doctor_id', userId)
        .order('created_at', { ascending: false});

      if (error) throw new Error(error.message);
      return data as DoctorContact[];
    },
    enabled: !!userId
  });
}