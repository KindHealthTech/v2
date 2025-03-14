-- Add patient_doctor_contacts table
CREATE TABLE IF NOT EXISTS public.patient_doctor_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(patient_id, doctor_id)
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_doctor_contacts_patient_id ON public.patient_doctor_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_contacts_doctor_id ON public.patient_doctor_contacts(doctor_id);