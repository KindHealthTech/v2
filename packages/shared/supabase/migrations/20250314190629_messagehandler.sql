-- Fix the handle_patient_message function that was trying to access NEW.doctor_id
-- First, drop the duplicate function definition if it exists
DROP FUNCTION IF EXISTS handle_patient_message CASCADE;

-- Then recreate with the correct implementation
CREATE OR REPLACE FUNCTION handle_patient_message()
RETURNS TRIGGER AS $$
DECLARE
    v_doctor_availability RECORD;
    v_chat RECORD;
BEGIN
    -- Get chat details first
    SELECT * FROM chats
    WHERE id = NEW.chat_id
    INTO v_chat;
    
    -- Only if we have a valid chat record
    IF v_chat IS NOT NULL THEN
        -- Get doctor's availability using the doctor_id from the chat
        SELECT * FROM doctor_availability 
        WHERE doctor_id = v_chat.doctor_id 
        INTO v_doctor_availability;
        
        -- If doctor is unavailable, trigger AI response
        IF v_doctor_availability IS NOT NULL AND v_doctor_availability.status = 'unavailable' THEN
            -- Insert into ai_responses (will be processed by Edge Function)
            INSERT INTO ai_responses (
                doctor_id,
                patient_id,
                chat_id,
                message
            ) VALUES (
                v_chat.doctor_id,
                NEW.sender_id,
                NEW.chat_id,
                'AI Response Pending'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_patient_message ON messages;

-- Recreate the trigger with the fixed function
CREATE TRIGGER on_patient_message
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.sender_type = 'patient'::message_sender_type)
    EXECUTE FUNCTION handle_patient_message();
