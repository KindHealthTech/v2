-- Create enum for message sender types
create type message_sender_type as enum ('doctor', 'patient', 'ai');

-- Add sender_type to messages table
alter table public.messages
add column sender_type message_sender_type not null default 'patient',
add column recipient_id uuid references public.users(id);

-- Function to determine sender type based on user role
create or replace function get_sender_type(user_id uuid)
returns message_sender_type as $$
declare
    user_role_val user_role;
begin
    select role into user_role_val
    from public.users
    where id = user_id;

    return case 
        when user_role_val = 'doctor' then 'doctor'::message_sender_type
        else 'patient'::message_sender_type
    end;
end;
$$ language plpgsql security definer;

-- Function to automatically set sender_type based on sender_id
create or replace function set_message_sender_type()
returns trigger as $$
begin
    NEW.sender_type = get_sender_type(NEW.sender_id);
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to automatically set sender_type
do $$ 
begin
    if exists (select 1 from pg_trigger where tgname = 'set_message_sender_type_trigger') then
        drop trigger set_message_sender_type_trigger on messages;
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'set_message_sender_type_trigger') then
        create trigger set_message_sender_type_trigger
            before insert on public.messages
            for each row
            when (NEW.sender_type = 'patient')
            execute function set_message_sender_type();
    end if;
end $$;

-- Update handle_patient_message function to use the new sender_type enum
create or replace function handle_patient_message()
returns trigger as $$
declare
    v_doctor_availability record;
    v_chat record;
begin
    -- Get doctor's availability
    select * from doctor_availability 
    where doctor_id = NEW.doctor_id 
    into v_doctor_availability;

    -- Get chat details
    select * from chats
    where id = NEW.chat_id
    into v_chat;

    -- If doctor is unavailable, trigger AI response
    if v_doctor_availability.status = 'unavailable' then
        -- Insert into ai_responses (will be processed by Edge Function)
        insert into ai_responses (
            doctor_id,
            patient_id,
            chat_id,
            message
        ) values (
            v_chat.doctor_id,
            NEW.sender_id,
            NEW.chat_id,
            'AI Response Pending'
        );
    end if;

    return NEW;
end;
$$ language plpgsql security definer;

-- Drop and recreate the trigger with correct condition
do $$ 
begin
    if exists (select 1 from pg_trigger where tgname = 'on_patient_message') then
        drop trigger on_patient_message on messages;
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'on_patient_message') then
        create trigger on_patient_message
            after insert on messages
            for each row
            when (NEW.sender_type = 'patient'::message_sender_type)
            execute function handle_patient_message();
    end if;
end $$;

-- Create AI responses table
create table if not exists public.ai_responses (
    id uuid default gen_random_uuid() primary key,
    doctor_id uuid references auth.users(id) on delete cascade,
    patient_id uuid references auth.users(id) on delete cascade,
    chat_id uuid references public.chats(id) on delete cascade,
    message text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add RLS policies
alter table public.ai_responses enable row level security;

-- Allow doctors to view their AI responses
create policy "Doctors can view their AI responses"
    on public.ai_responses
    for select
    to authenticated
    using (auth.uid() = doctor_id);

-- Allow patients to view AI responses for their chats
create policy "Patients can view AI responses for their chats"
    on public.ai_responses
    for select
    to authenticated
    using (auth.uid() = patient_id);

-- Create function to handle AI responses
create or replace function handle_patient_message()
returns trigger as $$
declare
    v_doctor_availability record;
    v_chat record;
begin
    -- Get doctor's availability
    select * from doctor_availability 
    where doctor_id = NEW.doctor_id 
    into v_doctor_availability;

    -- Get chat details
    select * from chats
    where id = NEW.chat_id
    into v_chat;

    -- If doctor is unavailable, trigger AI response
    if v_doctor_availability.status = 'unavailable' then
        -- Insert into ai_responses (will be processed by Edge Function)
        insert into ai_responses (
            doctor_id,
            patient_id,
            chat_id,
            message
        ) values (
            NEW.doctor_id,
            NEW.sender_id,
            NEW.chat_id,
            'AI Response Pending' -- Will be updated by Edge Function
        );
    end if;

    return NEW;
end;
$$ language plpgsql security definer;


