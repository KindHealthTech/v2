import { useAuth } from '@/context/auth';
import { supabase } from '@kht/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { set } from 'date-fns';

export interface Availability {
  id: string;
  doctor_id: string;
  status: 'available' | 'unavailable';
  start_time: string;
  end_time: string;
  auto_response?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityFormData {
  status: 'available' | 'unavailable';
  start_time: number;
  end_time: number;
  auto_response: string;
}

export const defaultStartTime = set(new Date(), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
export const defaultEndTime = set(new Date(), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });

export const defaultFormData: AvailabilityFormData = {
  status: 'available',
  start_time: defaultStartTime.getTime(),
  end_time: defaultEndTime.getTime(),
  auto_response: 'I am currently unavailable. I will respond to your message as soon as possible.',
};

export function useAvailability() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['availability', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Availability | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateAvailability() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: availability } = useAvailability();

  return useMutation({
    mutationFn: async (formData: AvailabilityFormData) => {
      if (!user?.id) throw new Error('No user ID');
      
      const payload = {
        doctor_id: user.id,
        status: formData.status,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        auto_response: formData.auto_response,
      };

      if (availability) {
        const { data, error } = await supabase
          .from('doctor_availability')
          .update(payload)
          .eq('id', availability.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('doctor_availability')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['availability', user?.id]
      });
    },
  });
}
