import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openai = new OpenAIApi(
      new Configuration({
        apiKey: Deno.env.get('OPENAI_API_KEY'),
      })
    )

    // Get chats with delayed responses (over 10 minutes)
    const { data: delayedChats, error: fetchError } = await supabaseClient
      .rpc('check_delayed_responses', { minutes: 10 })

    if (fetchError) {
      throw fetchError
    }

    if (!delayedChats?.length) {
      return new Response(JSON.stringify({ message: 'No delayed responses to handle' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Process each delayed chat
    const results = await Promise.all(
      delayedChats.map(async (chat) => {
        try {
          // Get doctor's auto response message
          const { data: doctorAvailability } = await supabaseClient
            .from('doctor_availability')
            .select('auto_response')
            .eq('doctor_id', chat.doctor_id)
            .single()

          // Get recent chat context
          const { data: recentMessages } = await supabaseClient
            .from('messages')
            .select('content, sender_type, created_at')
            .eq('chat_id', chat.chat_id)
            .order('created_at', { ascending: false })
            .limit(5)

          const chatContext = recentMessages
            ?.reverse()
            .map((msg) => `${msg.sender_type}: ${msg.content}`)
            .join('\n')

          // Generate AI response
          const completion = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are a medical assistant responding because the doctor hasn't replied in ${chat.minutes_since_last_message.toFixed(0)} minutes. 
                Be empathetic and professional while explaining the delay. If appropriate, suggest the patient to wait a bit longer or consider booking another appointment.
                The doctor's automated message is: "${doctorAvailability?.auto_response || 'The doctor is currently unavailable.'}"`,
              },
              {
                role: 'user',
                content: `Recent chat context:\n${chatContext}\n\nPlease provide an appropriate response acknowledging the delay.`,
              },
            ],
            max_tokens: 300,
            temperature: 0.7,
          })

          const aiMessage = completion.data.choices[0]?.message?.content || 
            'I notice the doctor hasn\'t responded yet. They might be with another patient. Please wait a bit longer or consider scheduling another appointment if this is urgent.'

          // Insert AI response into messages
          const { error: messageError } = await supabaseClient
            .from('messages')
            .insert({
              chat_id: chat.chat_id,
              content: aiMessage,
              sender_id: chat.doctor_id,
              sender_type: 'ai',
              recipient_id: chat.patient_id,
            })

          if (messageError) throw messageError

          // Insert into ai_responses for tracking
          const { error: aiError } = await supabaseClient
            .from('ai_responses')
            .insert({
              doctor_id: chat.doctor_id,
              patient_id: chat.patient_id,
              chat_id: chat.chat_id,
              message: aiMessage,
            })

          if (aiError) throw aiError

          return {
            chat_id: chat.chat_id,
            success: true,
            message: aiMessage,
          }
        } catch (error) {
          console.error(`Error processing chat ${chat.chat_id}:`, error)
          return {
            chat_id: chat.chat_id,
            success: false,
            error: error.message,
          }
        }
      })
    )

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
