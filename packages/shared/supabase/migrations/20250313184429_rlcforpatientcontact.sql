-- Enable Row Level Security on the table
ALTER TABLE public.patient_doctor_contacts ENABLE ROW LEVEL SECURITY;

-- Patient doctor contacts policies
CREATE POLICY "Patients can view their doctor contacts"
ON public.patient_doctor_contacts
FOR SELECT
TO authenticated
USING (
  auth.uid() = patient_id
);

CREATE POLICY "Patients can add doctor contacts"
ON public.patient_doctor_contacts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = patient_id AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'patient'
  )
);

CREATE POLICY "Patients can update their doctor contacts"
ON public.patient_doctor_contacts
FOR UPDATE
TO authenticated
USING (
  auth.uid() = patient_id
)
WITH CHECK (
  auth.uid() = patient_id
);

CREATE POLICY "Patients can delete their doctor contacts"
ON public.patient_doctor_contacts
FOR DELETE
TO authenticated
USING (
  auth.uid() = patient_id
);

-- Doctors need to view which patients have added them
CREATE POLICY "Doctors can view patients who added them"
ON public.patient_doctor_contacts
FOR SELECT
TO authenticated
USING (
  auth.uid() = doctor_id AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'doctor'
  )
);