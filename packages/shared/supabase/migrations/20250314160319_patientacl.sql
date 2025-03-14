-- Enable Row Level Security on the table
ALTER TABLE public.doctor_patient_contacts ENABLE ROW LEVEL SECURITY;

-- Patient doctor contacts policies
CREATE POLICY "Patients can view their doctor contacts"
ON public.doctor_patient_contacts
FOR SELECT
TO authenticated
USING (
  auth.uid() = patient_id
);
