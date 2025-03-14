-- This migration addresses RLS issues for patient chat functionality
-- Specifically ensuring that patients can see doctor information for their chats

-- First, let's verify the RLS policy for chats
-- This typically should allow patients to see their own chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- RLS for patients to view their own chats
CREATE POLICY "Patients can view their own chats"
  ON public.chats
  FOR SELECT 
  USING (auth.uid() = patient_id);

-- The key issue: We need to allow patients to see doctor profiles that they have a chat with
-- Enable RLS on users table if not already enabled for doctor users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow patients to read doctor user records if they have a chat with that doctor
CREATE POLICY "Patients can view doctors they have chats with"
  ON public.users
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE doctor_id = id 
      AND patient_id = auth.uid()
    ) AND role = 'doctor'
  );

-- Also ensure patients can view doctor profiles for doctors they're chatting with
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view profiles of doctors they chat with"
  ON public.doctor_profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE public.doctor_profiles.id = public.chats.doctor_id
      AND public.chats.patient_id = auth.uid()
    )
  );

-- Add indexes to improve join performance
CREATE INDEX IF NOT EXISTS idx_chats_doctor_id ON public.chats(doctor_id);
CREATE INDEX IF NOT EXISTS idx_chats_patient_id ON public.chats(patient_id);