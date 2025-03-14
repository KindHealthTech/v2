export interface ProfileFormData {
  full_name: string;
  specialization: string;
  qualification: string;
  years_of_experience: number;
}

export interface AvailabilityFormData {
  start_time: Date;
  end_time: Date;
  auto_response: string;
  status: 'available'| 'unavailable';
}

export type OnboardingStep = 'profile' | 'availability';
