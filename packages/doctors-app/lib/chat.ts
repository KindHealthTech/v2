import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Database } from '@kht/shared';

// Use the types from the shared package instead of redefining them
export type Message = Database['public']['Tables']['messages']['Row'];
export type Chat = Database['public']['Tables']['chats']['Row'] & {
  messages?: Message[];
};

export function useChat(patientId?: string, doctorId?: string) {
  const queryClient = useQueryClient();

  // Just try to fetch the chat if it exists - don't create it yet
  // We'll create it on demand when sending the first message
  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', patientId, doctorId],
    queryFn: async () => {
      if (!patientId || !doctorId) {
        console.log('Missing IDs, cannot get chat');
        return null;
      }
      
      console.log('Fetching chat if it exists...', { patientId, doctorId });
      const { data: existingChat, error: fetchError } = await supabase
        .from('chats')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching chat:', fetchError);
        return null;
      }

      if (existingChat) {
        console.log('Found existing chat:', existingChat.id);
        return existingChat as Chat;
      }

      console.log('No existing chat found - will create on first message');
      return null;
    },
    enabled: !!patientId && !!doctorId,
  });

  // Get messages for the chat
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', chat?.id],
    queryFn: async () => {
      if (!chat?.id) throw new Error('Chat ID required');

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!chat?.id,
  });

  // Direct send message mutation that includes creating patient-doctor relationship
  const { mutate: sendMessage, isPending: sendingMessage } = useMutation({
    mutationFn: async (content: string) => {
      if (!doctorId) throw new Error('Doctor ID required');
      if (!patientId) throw new Error('Patient ID required');

      console.log('[SEND] Starting sendMessage with:', { doctorId, patientId, content });
      
      // STEP 1: First create the relationship to satisfy RLS policies
      console.log('[SEND] Ensuring patient-doctor relationship exists');
      const { error: relationError } = await supabase
        .from('patient_doctor_contacts')
        .upsert({
          patient_id: patientId,
          doctor_id: doctorId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'patient_id,doctor_id' }); // Upsert to avoid duplicates

      if (relationError) {
        console.error('[SEND] Error creating relationship:', relationError);
        // Continue anyway - the relationship might still exist or not be required
      }
      
      // STEP 2: Get or create chat
      let chatId = chat?.id;
      if (!chatId) {
        console.log('[SEND] No chat ID found, checking for existing chat');
        
        // First try to get existing chat to avoid duplicates
        const { data: existingChat } = await supabase
          .from('chats')
          .select('id')
          .eq('doctor_id', doctorId)
          .eq('patient_id', patientId)
          .maybeSingle();
          
        if (existingChat?.id) {
          console.log('[SEND] Found existing chat:', existingChat.id);
          chatId = existingChat.id;
        } else {
          console.log('[SEND] Creating new chat');
          // Create new chat with the current time
          const now = new Date().toISOString();
          const { data: newChat, error: chatError } = await supabase
            .from('chats')
            .insert({
              doctor_id: doctorId,
              patient_id: patientId,
              created_at: now,
              last_message_at: now
            })
            .select()
            .single();

          if (chatError) {
            console.error('[SEND] Error creating chat:', chatError);
            throw new Error('Failed to create chat: ' + chatError.message);
          }

          chatId = newChat.id;
          console.log('[SEND] Created new chat with ID:', chatId);
          
          // Invalidate queries to ensure UI updates
          queryClient.invalidateQueries({ queryKey: ['chat', patientId, doctorId] });
        }
      }

      // STEP 3: Send the message
      console.log('[SEND] Sending message to chat ID:', chatId);
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: doctorId,
          content,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[SEND] Error sending message:', error);
        throw error;
      }
      
      console.log('[SEND] Message sent successfully:', data);
      
      // STEP 4: Update the chat's last_message_at timestamp
      const now = new Date().toISOString();
      console.log('[SEND] Updating chat timestamp to:', now);
      const { error: updateError } = await supabase
        .from('chats')
        .update({ last_message_at: now })
        .eq('id', chatId);
      
      if (updateError) {
        console.error('[SEND] Error updating chat last_message_at:', updateError);
      }

      return { ...data, chat_id: chatId } as Message;
    },
    onSuccess: (newMessage) => {
      console.log('[SEND] Message cache update:', newMessage);
      
      // Update messages cache
      queryClient.setQueryData(['messages', newMessage.chat_id], (old: Message[] = []) => {
        if (!old) return [newMessage];
        // Avoid duplicates
        const exists = old.some(m => m.id === newMessage.id);
        if (exists) return old;
        return [...old, newMessage];
      });
      
      // Update chat's last_message_at in local cache
      queryClient.setQueryData(['chat', patientId, doctorId], (oldChat: Chat | null) => {
        if (!oldChat) {
          // Create new chat entry if it doesn't exist in cache
          return {
            id: newMessage.chat_id,
            doctor_id: doctorId,
            patient_id: patientId,
            created_at: newMessage.created_at,
            last_message_at: newMessage.created_at
          } as Chat;
        }
        return {
          ...oldChat,
          id: newMessage.chat_id,
          last_message_at: newMessage.created_at,
        };
      });

      // Force refresh all chats data
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  // Subscribe to new messages and chat updates
  const subscribeToMessages = (chatId: string) => {
    console.log(`Subscribing to messages for chat ${chatId}`);
    // Create a channel for this specific chat
    const channel = supabase.channel(`chat:${chatId}`);

    // Subscribe to new messages
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('New message received via subscription:', payload);
          const newMessage = payload.new as Message;
          // Only update if the message is from the other person
          if (newMessage.sender_id !== doctorId) {
            queryClient.setQueryData(['messages', chatId], (old: Message[] = []) => [...old, newMessage]);
            // Update chat's last_message_at
            queryClient.setQueryData(['chat', patientId, doctorId], (oldChat: Chat) => ({
              ...oldChat,
              last_message_at: newMessage.created_at,
            }));
          }
        }
      )
      // Subscribe to chat updates (e.g., read receipts)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;
            queryClient.setQueryData(['messages', chatId], (old: Message[] = []) => 
              old.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
          }
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      channel.unsubscribe();
    };
  };

  return {
    chat,
    messages,
    sendMessage,
    isLoading: chatLoading || messagesLoading,
    isSending: sendingMessage,
    subscribeToMessages,
  };
}
