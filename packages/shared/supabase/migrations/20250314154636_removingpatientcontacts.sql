-- Drop RLS policies for patient_doctor_contacts table
DROP POLICY IF EXISTS "Patients can view their doctor contacts" ON public.patient_doctor_contacts;
DROP POLICY IF EXISTS "Patients can add doctor contacts" ON public.patient_doctor_contacts;
DROP POLICY IF EXISTS "Patients can update their doctor contacts" ON public.patient_doctor_contacts;
DROP POLICY IF EXISTS "Patients can delete their doctor contacts" ON public.patient_doctor_contacts;
DROP POLICY IF EXISTS "Doctors can view patients who added them" ON public.patient_doctor_contacts;

-- Drop indexes for the patient_doctor_contacts table
DROP INDEX IF EXISTS idx_patient_doctor_contacts_patient_id;
DROP INDEX IF EXISTS idx_patient_doctor_contacts_doctor_id;

-- Drop the patient_doctor_contacts table
DROP TABLE IF EXISTS public.patient_doctor_contacts;

-- Make sure the doctor_patient_contacts has RLS enabled
ALTER TABLE public.doctor_patient_contacts ENABLE ROW LEVEL SECURITY;

-- Update doctor_patient_contacts RLS policies if needed
-- (These should already exist from the initial migration)
