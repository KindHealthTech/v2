-- Add last_response_at to chats table to track doctor's response time
alter table public.chats 
add column if not exists last_doctor_response_at timestamptz,
add column if not exists last_patient_message_at timestamptz;

-- Function to update last message timestamps
create or replace function update_chat_timestamps()
returns trigger as $$
begin
    if NEW.sender_type = 'doctor' then
        update chats 
        set last_doctor_response_at = NEW.created_at
        where id = NEW.chat_id;
    elsif NEW.sender_type = 'patient' then
        update chats 
        set last_patient_message_at = NEW.created_at
        where id = NEW.chat_id;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to update timestamps on new messages
create trigger update_chat_timestamps_trigger
    after insert on messages
    for each row
    execute function update_chat_timestamps();

-- Function to check for delayed responses
create or replace function check_delayed_responses(minutes int default 10)
returns table (
    chat_id uuid,
    doctor_id uuid,
    patient_id uuid,
    minutes_since_last_message int
) as $$
begin
    return query
    select 
        c.id as chat_id,
        c.doctor_id,
        c.patient_id,
        extract(epoch from (now() - c.last_patient_message_at))/60 as minutes_since_last_message
    from chats c
    where 
        -- Has a patient message without doctor response
        c.last_patient_message_at is not null
        and (
            c.last_doctor_response_at is null 
            or c.last_doctor_response_at < c.last_patient_message_at
        )
        -- No AI response in the last 10 minutes
        and not exists (
            select 1 
            from messages m 
            where m.chat_id = c.id 
            and m.sender_type = 'ai'
            and m.created_at > c.last_patient_message_at
        )
        -- More than specified minutes have passed
        and c.last_patient_message_at < now() - (minutes || ' minutes')::interval;
end;
$$ language plpgsql security definer;
