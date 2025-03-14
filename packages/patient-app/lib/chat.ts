import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Database } from '@kht/shared';

// Use the types from the shared package
export type Message = Database['public']['Tables']['messages']['Row'];

// Define a more flexible Chat type that matches our query results
export type Chat = {
  id: string;
  doctor_id: string;
  patient_id: string;
  created_at: string;
  last_message_at: string | null;
  updated_at?: string; // Make updated_at optional since we don't always have it
  messages?: Message[];
  doctor?: any; // For backward compatibility 
  users?: {
    id: string;
    phone_number: string;
    role: string;
    doctor_profiles?: {
      id: string;
      full_name: string;
    }[];
  };
};

export function usePatientChat(patientId?: string) {
  const queryClient = useQueryClient();

  // Fetch all chats for this patient along with associated doctor information
  const { data: chats, isLoading: chatsLoading, refetch: refetchChats } = useQuery({
    queryKey: ['patient-chats', patientId],
    queryFn: async () => {
      console.log('queryFn executing for patient-chats with patientId:', patientId);
      if (!patientId) {
        console.log('Missing patient ID, cannot get chats');
        return [];
      }
      
      console.log('Fetching chats for patient ID:', patientId);
      
      // First, get all doctor-patient relationships for this patient
      console.log('Fetching doctor_patient_contacts for patient:', patientId);
      const { data: contacts, error: contactsError } = await supabase
        .from('doctor_patient_contacts')
        .select('doctor_id')
        .eq('patient_id', patientId);
      
      if (contactsError) {
        console.error('Error fetching doctor contacts:', contactsError);
        return [];
      }
      
      if (!contacts || contacts.length === 0) {
        console.log('No doctor contacts found for patient');
        return [];
      }
      
      console.log(`Found ${contacts.length} doctor contacts for patient`);
      
      // Extract doctor IDs
      const doctorIds = contacts.map(contact => contact.doctor_id);
      
      // Fetch all chats for these doctor relationships
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          id,
          doctor_id,
          patient_id,
          last_message_at,
          created_at,
          doctor:users!chats_doctor_id_fkey(id, phone_number, role, doctor_profiles(full_name))
        `)
        .eq('patient_id', patientId)
        .in('doctor_id', doctorIds)
        .order('last_message_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (chatError) {
        console.error('Error fetching chats:', chatError);
        return [];
      }
      
      console.log(`Found ${chatData?.length || 0} chats for patient`);
      
      // Process the data to ensure it matches our expected format
      const processedChats = (chatData || []).map(chat => {
        // Make a copy to avoid mutating the original
        const processedChat = {...chat};
        
        // Enhanced logging for doctor info debugging
        console.log('Doctor info object for chat', chat.id, ':', JSON.stringify(chat.doctor, null, 2));
        
        // Check and log the structure of doctor_profiles
        if (chat.doctor) {
          const doctor = chat.doctor as any; // Use any to bypass TypeScript restrictions for debugging
          
          if (Array.isArray(doctor.doctor_profiles)) {
            console.log('Doctor profiles is an array with length:', doctor.doctor_profiles.length);
            if (doctor.doctor_profiles.length > 0) {
              console.log('First profile name:', doctor.doctor_profiles[0]?.full_name);
            } else {
              console.log('Doctor profiles array is empty');
            }
          } else if (typeof doctor.doctor_profiles === 'object' && doctor.doctor_profiles !== null) {
            // It might be an object instead of an array (Supabase sometimes returns this way)
            console.log('Doctor profiles is an object:', JSON.stringify(doctor.doctor_profiles, null, 2));
            
            // Ensure doctor_profiles is always an array for consistent handling
            if (!Array.isArray(doctor.doctor_profiles)) {
              if (doctor.doctor_profiles.full_name) {
                // Convert single object to array
                // Need to use 'as any' to modify the object due to TypeScript limitations
                (processedChat.doctor as any).doctor_profiles = [doctor.doctor_profiles];
                console.log('Converted doctor_profiles object to array');
              }
            }
          } else {
            console.log('Doctor profiles is neither array nor object:', doctor.doctor_profiles);
          }
        } else {
          console.log('No doctor object for this chat');
        }
        
        return processedChat;
      });
      
      return processedChats as Chat[];
    },
    enabled: !!patientId,
  });

  // Fetch details for a specific chat
  const fetchChat = async (chatId: string) => {
    if (!chatId) {
      console.log('Missing chat ID, cannot get chat details');
      return null;
    }
    
    console.log('Fetching details for chat ID:', chatId);
    
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select(`
        id,
        doctor_id,
        patient_id,
        last_message_at,
        created_at,
        doctor:users!chats_doctor_id_fkey(id, phone_number, role, doctor_profiles(full_name))
      `)
      .eq('id', chatId)
      .single();
    
    if (chatError) {
      console.error('Error fetching chat details:', chatError);
      return null;
    }
    
    console.log('Chat details fetched successfully with doctor info');
    console.log('Doctor info available:', !!chatData?.doctor);
    
    return chatData as Chat;
  };

  // Get messages for a specific chat - with enhanced logging
  const fetchMessages = async (chatId: string) => {
    if (!chatId) {
      console.log('🚫 Missing chat ID, cannot get messages');
      return [];
    }
    
    console.log('🚀 DIRECT API CALL: Fetching messages for chat ID:', chatId);
    
    try {
      // Make a direct call to get messages
      console.log('📝 Step 1: Checking chat access');
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id, doctor_id, patient_id')
        .eq('id', chatId)
        .single();
      
      if (chatError) {
        console.error('❌ Error verifying chat access:', chatError);
        console.error('❌ Error code:', chatError.code, 'Message:', chatError.message);
        return [];
      }
      
      console.log('✅ Chat access verified. Patient ID:', patientId, 'Chat patient ID:', chatData.patient_id);
      
      // Now fetch the actual messages
      console.log('📝 Step 2: Fetching messages with chat_id =', chatId);
      const messagesResponse = await supabase
        .from('messages')
        .select('id, content, sender_id, chat_id, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      console.log('📊 Messages API response status:', messagesResponse.status);
      
      if (messagesResponse.error) {
        console.error('❌ Error fetching messages:', messagesResponse.error);
        console.error('❌ Error code:', messagesResponse.error.code, 'Message:', messagesResponse.error.message);
        
        // Check if this is an RLS issue
        if (messagesResponse.error.code === 'PGRST116') {
          console.error('⚠️ RLS policy may be preventing access to messages table!');
          
          // Try to get session info for debugging
          const { data: sessionData } = await supabase.auth.getUser();
          console.log('👤 Current user:', sessionData?.user?.id);
          console.log('👤 Looking for messages where chat_id =', chatId);
        }
        
        // Return empty array for UI to handle
        return [];
      }
      
      const data = messagesResponse.data;
      
      // Log the results
      if (!data || data.length === 0) {
        console.log('ℹ️ No messages found for chat ID:', chatId);
        return [];
      }
      
      console.log(`✅ SUCCESS: Found ${data.length} messages for chat ${chatId}`);
      console.log('📋 First message:', JSON.stringify(data[0], null, 2));
      
      return data as Message[];
    } catch (error) {
      console.error('💥 Unexpected error in fetchMessages:', error);
      return [];
    }
  };

  // Send a message to a chat
  const { mutate: sendMessage, isPending: sendingMessage } = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      if (!patientId) throw new Error('Patient ID required');
      if (!chatId) throw new Error('Chat ID required');
      if (!content.trim()) throw new Error('Message content required');

      console.log('[SEND] Starting sendMessage with:', { patientId, chatId, content });
      
      // Send the message
      const now = new Date().toISOString();
      const message = {
        chat_id: chatId,
        sender_id: patientId,
        content: content.trim(),
        created_at: now
      };
      
      console.log('[SEND] Sending message:', message);
      
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.error('[SEND] Error sending message:', error);
        throw error;
      }
      
      console.log('[SEND] Message sent successfully:', data);
      
      // Update the chat's last_message_at timestamp
      await supabase
        .from('chats')
        .update({ last_message_at: now })
        .eq('id', chatId);
      
      return data as Message;
    },
    onSuccess: (newMessage) => {
      // Update cache with the new message
      queryClient.invalidateQueries({ queryKey: ['messages', newMessage.chat_id] });
      queryClient.invalidateQueries({ queryKey: ['patient-chats', patientId] });
    },
  });

  // Mark messages as read
  const markMessagesAsRead = async (chatId: string, doctorId: string) => {
    if (!patientId || !chatId || !doctorId) {
      console.log('Missing required IDs, cannot mark messages as read');
      return;
    }
    
    console.log('Marking messages as read for chat:', chatId);
    
    // Get unread messages from doctor
    const { data: unreadMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', chatId)
      .eq('sender_id', doctorId)
      .is('read_at', null);
    
    if (fetchError) {
      console.error('Error fetching unread messages:', fetchError);
      return;
    }
    
    if (!unreadMessages || unreadMessages.length === 0) {
      console.log('No unread messages to mark as read');
      return;
    }
    
    console.log(`Marking ${unreadMessages.length} messages as read`);
    
    const unreadIds = unreadMessages.map(msg => msg.id);
    const now = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('messages')
      .update({ read_at: now })
      .in('id', unreadIds);
    
    if (updateError) {
      console.error('Error marking messages as read:', updateError);
    } else {
      console.log('Messages marked as read successfully');
      // Invalidate cached messages to reflect read status
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    }
  };

  // Subscribe to new messages for a specific chat
  const subscribeToMessages = (chatId: string, onNewMessage?: (payload: any) => void) => {
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
          
          // IMPORTANT: Only ONE way to handle message updates to prevent infinite loops
          // Either use React Query invalidation OR callback, not both
          if (onNewMessage && typeof onNewMessage === 'function') {
            // If callback provided, use it instead of query invalidation
            console.log('Using direct callback for message update');
            onNewMessage(payload); // Pass the payload to callback for more control
          } else {
            // Only use query invalidation if no callback is provided
            console.log('Using query invalidation for message update');
            queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
            queryClient.invalidateQueries({ queryKey: ['patient-chats', patientId] });
          }
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      console.log(`Unsubscribing from messages for chat ${chatId}`);
      channel.unsubscribe();
    };
  };

  return {
    chats,
    fetchChat,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
    subscribeToMessages,
    isLoading: chatsLoading,
    isSending: sendingMessage,
    refetchChats
  };
}
