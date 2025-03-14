import { Factor, UserAppMetadata, UserIdentity, UserMetadata } from "@supabase/supabase-js";

export type UserRole = 'doctor' | 'patient';

export interface User {
  id: string
  app_metadata: UserAppMetadata
  user_metadata: UserMetadata
  aud: string
  confirmation_sent_at?: string
  recovery_sent_at?: string
  email_change_sent_at?: string
  new_email?: string
  new_phone?: string
  invited_at?: string
  action_link?: string
  email?: string
  phone?: string
  created_at: string
  confirmed_at?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  last_sign_in_at?: string
  role?: string
  updated_at?: string
  identities?: UserIdentity[]
  is_anonymous?: boolean
  factors?: Factor[]
}

export interface DoctorProfile {
  id: string;
  specialization: string;
  qualification: string;
  years_of_experience: number;
  hospital_affiliation?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientProfile {
  id: string;
  date_of_birth: string;
  gender?: string;
  medical_history?: string;
  allergies?: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  doctor_id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      doctor_profiles: {
        Row: DoctorProfile;
        Insert: Omit<DoctorProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DoctorProfile, 'id'>>;
      };
      patient_profiles: {
        Row: PatientProfile;
        Insert: Omit<PatientProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PatientProfile, 'id'>>;
      };
      chats: {
        Row: Chat;
        Insert: Omit<Chat, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Chat, 'id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id'>>;
      };
    };
  };
};
