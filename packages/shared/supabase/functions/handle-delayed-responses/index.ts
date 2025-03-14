import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DelayedChat {
  id: string;
  doctor_id: string;
  patient_id: string;
  last_patient_message_at: string;
  last_doctor_response_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get chats with delayed responses (no doctor response within 10 minutes)
    const { data: delayedChats, error: fetchError } = await supabaseClient
      .rpc('get_delayed_response_chats')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    if (!delayedChats || delayedChats.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No delayed responses to process' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Process each delayed chat
    const processedChats = await Promise.all(
      delayedChats.map(async (chat: DelayedChat) => {
        // Check if we already have a pending AI response
        const { data: existingResponse } = await supabaseClient
          .from('ai_responses')
          .select('id')
          .eq('chat_id', chat.id)
          .eq('message', 'AI Response Pending')
          .maybeSingle();

        if (existingResponse) {
          return { chatId: chat.id, status: 'already_pending' };
        }

        // Create new AI response
        const { error: insertError } = await supabaseClient
          .from('ai_responses')
          .insert({
            doctor_id: chat.doctor_id,
            patient_id: chat.patient_id,
            chat_id: chat.id,
            message: 'AI Response Pending'
          });

        if (insertError) {
          return { chatId: chat.id, status: 'error', error: insertError.message };
        }

        return { chatId: chat.id, status: 'queued' };
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedChats 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
