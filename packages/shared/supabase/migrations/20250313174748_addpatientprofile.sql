-- Add profile_completed column to patient_profiles table
ALTER TABLE public.patient_profiles
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Update existing rows to have profile_completed = false
UPDATE public.patient_profiles
SET profile_completed = FALSE
WHERE profile_completed IS NULL;

-- Ensure the column is not null
ALTER TABLE public.patient_profiles
ALTER COLUMN profile_completed SET NOT NULL;

COMMENT ON COLUMN public.patient_profiles.profile_completed IS 'Flag indicating if the patient has completed their profile setup';