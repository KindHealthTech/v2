import { createClient } from '@supabase/supabase-js';
import OpenAI from '@openai/openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIResponse {
  id: string;
  doctor_id: string;
  patient_id: string;
  chat_id: string;
  message: string;
  created_at: string;
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

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Get the latest AI response that needs processing
    const { data: aiResponse, error: fetchError } = await supabaseClient
      .from('ai_responses')
      .select('*, chats(*)')
      .eq('message', 'AI Response Pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ message: 'No pending AI responses' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get doctor's auto response message
    const { data: doctorAvailability } = await supabaseClient
      .from('doctor_availability')
      .select('auto_response')
      .eq('doctor_id', aiResponse.doctor_id)
      .single();

    // Get previous chat context
    const { data: previousMessages } = await supabaseClient
      .from('messages')
      .select('content, sender_type')
      .eq('chat_id', aiResponse.chat_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Prepare chat context for OpenAI
    const chatContext = previousMessages
      ?.reverse()
      .map((msg) => `${msg.sender_type}: ${msg.content}`)
      .join('\n');

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a medical assistant responding on behalf of a doctor who is currently unavailable. 
          The doctor's automated message is: "${doctorAvailability?.auto_response || 'I am currently unavailable.'}". 
          Provide a professional and helpful response while making it clear you are an AI assistant.`
        },
        {
          role: 'user',
          content: `Previous chat context:\n${chatContext}\n\nPlease provide an appropriate response.`
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const aiMessage = completion.choices[0]?.message?.content || 
      'I apologize, but I am unable to provide a response at this moment.';

    // Update AI response with generated message
    const { error: updateError } = await supabaseClient
      .from('ai_responses')
      .update({ message: aiMessage })
      .eq('id', aiResponse.id);

    if (updateError) {
      throw updateError;
    }

    // Insert AI message into chat
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: aiResponse.chat_id,
        content: aiMessage,
        sender_id: aiResponse.doctor_id,
        sender_type: 'ai',
        recipient_id: aiResponse.patient_id,
      });

    if (messageError) {
      throw messageError;
    }

    return new Response(
      JSON.stringify({ success: true, message: aiMessage }), 
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


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/handle-ai-responses' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
