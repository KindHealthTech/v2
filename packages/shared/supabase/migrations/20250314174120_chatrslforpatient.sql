-- Add a more permissive policy to ensure patients can access doctor information

-- First drop existing policy if it's causing problems
DROP POLICY IF EXISTS "Patients can view doctors they have chats with" ON public.users;

-- Create a new, more explicit policy
CREATE POLICY "Patients can view any doctor via chat" 
  ON public.users
  FOR SELECT 
  USING (
    -- User is a doctor that a patient has a chat with
    (
      EXISTS (
        SELECT 1 FROM public.chats 
        WHERE public.chats.doctor_id = public.users.id 
        AND public.chats.patient_id = auth.uid()
      ) 
      AND public.users.role = 'doctor'
    )
    OR
    -- Allow patients to view themselves (needed for other functionality)
    (auth.uid() = id)
  );

-- Fix the doctor_profiles policy as well
DROP POLICY IF EXISTS "Patients can view profiles of doctors they chat with" ON public.doctor_profiles;

CREATE POLICY "Patients can view any doctor profile they chat with"
  ON public.doctor_profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE public.chats.doctor_id = public.doctor_profiles.id
      AND public.chats.patient_id = auth.uid()
    )
  );

-- Add test policy to help debugging
-- This is temporary and can be removed later
CREATE POLICY "Debugging: Patients can view doctor information"
  ON public.users
  FOR SELECT 
  USING (role = 'doctor');
