-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('doctor', 'patient');

-- Create extension for UUID support if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

------------------------------------------
-- Create Tables
------------------------------------------

-- Create users table that extends auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'doctor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE
);

-- Create doctor_profiles table
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT,
  specialization TEXT,
  qualification TEXT,
  years_of_experience INTEGER,
  hospital_affiliation TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create doctor_availability table
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create patient_profiles table
CREATE TABLE public.patient_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  allergies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create chats table
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES public.users(id) NOT NULL,
  patient_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(doctor_id, patient_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create doctor_patient_contacts table
CREATE TABLE public.doctor_patient_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(doctor_id, patient_id)
);

------------------------------------------
-- Create Indexes
------------------------------------------

CREATE INDEX idx_users_phone_number ON public.users(phone_number);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_chats_doctor_id ON public.chats(doctor_id);
CREATE INDEX idx_chats_patient_id ON public.chats(patient_id);
CREATE INDEX idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_status ON public.doctor_availability(status);
CREATE INDEX idx_doctor_patient_contacts_doctor_id ON public.doctor_patient_contacts(doctor_id);
CREATE INDEX idx_doctor_patient_contacts_patient_id ON public.doctor_patient_contacts(patient_id);

------------------------------------------
-- Create Triggers
------------------------------------------

-- Users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Doctor profiles table
CREATE TRIGGER update_doctor_profiles_updated_at
    BEFORE UPDATE ON public.doctor_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Doctor availability table
CREATE TRIGGER update_doctor_availability_updated_at
    BEFORE UPDATE ON public.doctor_availability
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Patient profiles table
CREATE TRIGGER update_patient_profiles_updated_at
    BEFORE UPDATE ON public.patient_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Chats table
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Doctor patient contacts table
CREATE TRIGGER update_doctor_patient_contacts_updated_at
    BEFORE UPDATE ON public.doctor_patient_contacts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

------------------------------------------
-- Enable Row Level Security
------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_contacts ENABLE ROW LEVEL SECURITY;

------------------------------------------
-- Create RLS Policies
------------------------------------------

-- Users table policies
CREATE POLICY "Users can view own record and patient records"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR role = 'patient'
);

CREATE POLICY "Users can insert own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Doctor profiles policies
CREATE POLICY "Users can view their own doctor profile"
ON public.doctor_profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own doctor profile"
ON public.doctor_profiles
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own doctor profile"
ON public.doctor_profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can delete their own doctor profile"
ON public.doctor_profiles
FOR DELETE
TO authenticated
USING ((select auth.uid()) = id);

-- Doctor availability policies
CREATE POLICY "Doctors can view own availability"
ON public.doctor_availability
FOR SELECT
TO authenticated
USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can insert own availability"
ON public.doctor_availability
FOR INSERT
TO authenticated
WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update own availability"
ON public.doctor_availability
FOR UPDATE
TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete own availability"
ON public.doctor_availability
FOR DELETE
TO authenticated
USING (doctor_id = auth.uid());

-- Patient profiles policies
CREATE POLICY "Patients can view own profile"
ON public.patient_profiles
FOR SELECT
TO authenticated
USING (
  -- Allow if it's their own profile or if the user is a doctor
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'doctor'
  )
);

CREATE POLICY "Patients can update own profile"
ON public.patient_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Patients can insert own profile"
ON public.patient_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Chat policies
CREATE POLICY "Chat participants can view chats"
ON public.chats
FOR SELECT
TO authenticated
USING (
  auth.uid() = doctor_id OR
  auth.uid() = patient_id
);

CREATE POLICY "Chat participants can insert chats"
ON public.chats
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = doctor_id OR
  auth.uid() = patient_id
);

-- Message policies
CREATE POLICY "Chat participants can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
    AND (chats.doctor_id = auth.uid() OR chats.patient_id = auth.uid())
  )
);

CREATE POLICY "Chat participants can insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = chat_id
    AND (chats.doctor_id = auth.uid() OR chats.patient_id = auth.uid())
  )
);

-- Doctor patient contacts policies
CREATE POLICY "Doctors can view their patient contacts"
ON public.doctor_patient_contacts
FOR SELECT
TO authenticated
USING (
  auth.uid() = doctor_id
);

CREATE POLICY "Doctors can add patient contacts"
ON public.doctor_patient_contacts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = doctor_id AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'doctor'
  )
);
