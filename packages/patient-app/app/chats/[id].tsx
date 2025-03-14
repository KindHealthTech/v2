import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { usePatientAuth } from '@/context/patient-auth';
import { usePatientChat, Message as ChatMessage } from '@/lib/chat';
import tw from '@/lib/tailwind';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

type DoctorProfile = {
  full_name: string;
};

type Doctor = {
  id: string;
  doctor_profiles?: DoctorProfile[];
};

type ChatData = {
  id: string;
  doctor_id: string;
  doctor?: Doctor;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isFromDoctor: boolean;
};

// Prevent unnecessary re-renders with React.memo
const ChatDetailScreen = React.memo(function ChatDetailScreen() {
  const params = useLocalSearchParams<{ id: string, doctorName: string }>();
  const chatId = params.id;
  const initialDoctorName = params.doctorName || 'Doctor';
  
  console.log('Chat detail screen params:', params);
  
  const { patientState } = usePatientAuth();
  const userId = patientState.user?.id;
  const queryClient = useQueryClient();
  
  // Use our patient chat hook
  const { 
    fetchChat, 
    fetchMessages: fetchChatMessages, 
    sendMessage: sendChatMessage, 
    markMessagesAsRead,
    subscribeToMessages,
    isSending
  } = usePatientChat(userId);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  // Function to fetch messages and doctor info
  // Update the doctorInfo type to include phone number
  type DoctorInfo = {
    name: string;
    id?: string;
    phoneNumber?: string;
  };
  
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({ name: initialDoctorName });
  
  const loadChatData = async () => {
    if (!chatId || !userId) {
      console.error('Missing chat ID or user ID, cannot fetch chat data');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 TRACE: Loading chat data for chat ID:', chatId);
      
      // Get chat details to extract doctor info
      console.log('🔍 TRACE: Calling fetchChat with ID:', chatId);
      const chatDetails = await fetchChat(chatId);
      console.log('🔍 TRACE: fetchChat returned:', chatDetails ? 'Data received' : 'NULL DATA');
      
      if (!chatDetails) {
        console.error('❌ ERROR: Could not fetch chat details');
        return;
      }
      
      // Extract and set doctor info
      console.log('Chat details doctor info:', JSON.stringify(chatDetails.doctor, null, 2));
      
      // Handle doctor profile data which can come in different formats from Supabase
      const doctor = chatDetails.doctor as any; // Use any to bypass TypeScript restrictions
      let doctorName = initialDoctorName;
      let phoneNumber = '';
      
      if (doctor) {
        // Get phone number from the doctor record
        phoneNumber = doctor.phone_number || '';
        
        // Try to get the name from doctor_profiles in different formats
        if (doctor.doctor_profiles) {
          if (Array.isArray(doctor.doctor_profiles)) {
            // Handle array format
            if (doctor.doctor_profiles.length > 0 && doctor.doctor_profiles[0].full_name) {
              doctorName = doctor.doctor_profiles[0].full_name;
              console.log('Found doctor name from array:', doctorName);
            }
          } else if (typeof doctor.doctor_profiles === 'object') {
            // Handle object format
            if (doctor.doctor_profiles.full_name) {
              doctorName = doctor.doctor_profiles.full_name;
              console.log('Found doctor name from object:', doctorName);
            }
          }
        } else if (doctor.full_name) {
          // Direct name on doctor object as fallback
          doctorName = doctor.full_name;
          console.log('Found doctor name directly on user record:', doctorName);
        }
      }
      
      // Set the doctor info with whatever we found
      console.log('Setting doctor info - name:', doctorName, 'phone:', phoneNumber || 'None');
      setDoctorInfo({
        name: doctorName,
        id: chatDetails.doctor_id,
        phoneNumber: phoneNumber
      });
      
      // Get messages for this chat
      console.log('🔍 TRACE: About to call fetchChatMessages with ID:', chatId);
      const chatMessages = await fetchChatMessages(chatId);
      console.log('🔍 TRACE: fetchChatMessages returned with length:', chatMessages?.length);
      console.log('🔍 TRACE: Messages data type:', typeof chatMessages, Array.isArray(chatMessages) ? 'is array' : 'not array');
      console.log(`Found ${chatMessages.length} messages for chat ${chatId}`);
      
      // Format the messages for display
      console.log('🔍 TRACE: Formatting messages for display');
      const formattedMessages: Message[] = chatMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        createdAt: new Date(msg.created_at).toLocaleString(),
        isFromDoctor: msg.sender_id !== userId,
      }));
      
      setMessages(formattedMessages);
      
      // Mark messages from doctor as read if we have the doctor ID
      if (chatDetails.doctor_id) {
        markMessagesAsRead(chatId, chatDetails.doctor_id);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stabilize loadChatData with useCallback to prevent it from changing on every render
  const loadChatDataStable = React.useCallback(async () => {
    console.log('🧪 TRACE: loadChatDataStable function called!');
    console.log('🧪 TRACE: chatId =', chatId, 'userId =', userId);
    
    if (!chatId || !userId) {
      console.error('🛑 ERROR: Missing chat ID or user ID, cannot fetch chat data');
      return;
    }

    // Don't reload if we're already loading
    if (loading) {
      console.log('⚠️ WARNING: Already loading, skipping duplicate load');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 TRACE: Loading chat data for chat ID:', chatId);
      
      // Get chat details to extract doctor info
      console.log('🔍 TRACE: Calling fetchChat with ID:', chatId);
      const chatDetails = await fetchChat(chatId);
      console.log('🔍 TRACE: fetchChat returned:', chatDetails ? 'Data received' : 'NULL DATA');
      
      if (!chatDetails) {
        console.error('❌ ERROR: Could not fetch chat details');
        return;
      }
      
      // Extract and set doctor info
      console.log('Chat details doctor info:', JSON.stringify(chatDetails.doctor, null, 2));
      
      // Handle doctor profile data which can come in different formats from Supabase
      const doctor = chatDetails.doctor as any; // Use any to bypass TypeScript restrictions
      let doctorName = initialDoctorName;
      let phoneNumber = '';
      
      if (doctor) {
        // Get phone number from the doctor record
        phoneNumber = doctor.phone_number || '';
        
        // Try to get the name from doctor_profiles in different formats
        if (doctor.doctor_profiles) {
          if (Array.isArray(doctor.doctor_profiles)) {
            // Handle array format
            if (doctor.doctor_profiles.length > 0 && doctor.doctor_profiles[0].full_name) {
              doctorName = doctor.doctor_profiles[0].full_name;
              console.log('Found doctor name from array:', doctorName);
            }
          } else if (typeof doctor.doctor_profiles === 'object') {
            // Handle object format
            if (doctor.doctor_profiles.full_name) {
              doctorName = doctor.doctor_profiles.full_name;
              console.log('Found doctor name from object:', doctorName);
            }
          }
        } else if (doctor.full_name) {
          // Direct name on doctor object as fallback
          doctorName = doctor.full_name;
          console.log('Found doctor name directly on user record:', doctorName);
        }
      }
      
      // Set the doctor info with whatever we found
      console.log('Setting doctor info - name:', doctorName, 'phone:', phoneNumber || 'None');
      setDoctorInfo({
        name: doctorName,
        id: chatDetails.doctor_id,
        phoneNumber: phoneNumber
      });
      
      // Get messages for this chat
      console.log('🔍 TRACE: About to call fetchChatMessages with ID:', chatId);
      const chatMessages = await fetchChatMessages(chatId);
      console.log('🔍 TRACE: fetchChatMessages returned with length:', chatMessages?.length);
      console.log('🔍 TRACE: Messages data type:', typeof chatMessages, Array.isArray(chatMessages) ? 'is array' : 'not array');
      console.log(`Found ${chatMessages.length} messages for chat ${chatId}`);
      
      // Format the messages for display
      console.log('🔍 TRACE: Formatting messages for display');
      const formattedMessages: Message[] = chatMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        createdAt: new Date(msg.created_at).toLocaleString(),
        isFromDoctor: msg.sender_id !== userId,
      }));
      
      setMessages(formattedMessages);
      
      // Mark messages from doctor as read if we have the doctor ID
      if (chatDetails.doctor_id) {
        markMessagesAsRead(chatId, chatDetails.doctor_id);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId, userId, initialDoctorName, fetchChat, fetchChatMessages, markMessagesAsRead]);

  // Use a ref to track if data has been loaded to prevent repeated loads
  const dataLoadedRef = React.useRef(false);

  // Setup effect for initial data loading - with protection against multiple calls
  useEffect(() => {
    if (!chatId || !userId) {
      console.log('⚠️ Missing required data (chatId or userId)');
      return;
    }

    // Prevent duplicate loads if already loaded this data
    if (dataLoadedRef.current) {
      console.log('🛑 Data already loaded for this chat, skipping duplicate load');
      return;
    }

    console.log('🔄 ONE-TIME data load starting for chat ID:', chatId);
    
    // Set loading state
    setLoading(true);
    
    // Set flag to true to prevent additional loads
    dataLoadedRef.current = true;
    
    // Track if component is still mounted
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // First fetch chat details
        console.log('📱 Fetching chat details');
        const chatDetails = await fetchChat(chatId);
        
        // Avoid state updates if component unmounted
        if (!isMounted) {
          console.log('🚫 Component unmounted during data fetch, aborting');
          return;
        }
        
        if (!chatDetails) {
          console.error('❌ Could not fetch chat details');
          if (isMounted) setLoading(false);
          return;
        }
        
        // Process doctor info
        const doctor = chatDetails.doctor as any;
        let doctorName = initialDoctorName;
        let phoneNumber = '';
        
        if (doctor) {
          phoneNumber = doctor.phone_number || '';
          
          if (doctor.doctor_profiles) {
            if (Array.isArray(doctor.doctor_profiles) && doctor.doctor_profiles.length > 0) {
              doctorName = doctor.doctor_profiles[0].full_name || doctorName;
            } else if (doctor.doctor_profiles.full_name) {
              doctorName = doctor.doctor_profiles.full_name;
            }
          }
        }
        
        if (isMounted) {
          setDoctorInfo({
            name: doctorName,
            id: chatDetails.doctor_id,
            phoneNumber: phoneNumber
          });
        }
        
        // Then fetch messages - only once per component lifecycle
        console.log('📱 Fetching messages for chat ID:', chatId);
        const chatMessages = await fetchChatMessages(chatId);
        
        if (!isMounted) return;
        
        // Process and display messages
        if (chatMessages && Array.isArray(chatMessages)) {
          console.log(`📱 Found ${chatMessages.length} messages for chat`);
          
          if (chatMessages.length > 0) {
            const formattedMessages = chatMessages.map(msg => ({
              id: msg.id,
              content: msg.content,
              senderId: msg.sender_id,
              createdAt: new Date(msg.created_at).toLocaleString(),
              isFromDoctor: msg.sender_id !== userId,
            }));
            
            if (isMounted) {
              setMessages(formattedMessages);
            }
            
            // Mark messages as read
            if (chatDetails.doctor_id && isMounted) {
              markMessagesAsRead(chatId, chatDetails.doctor_id);
            }
          } else if (isMounted) {
            setMessages([]);
          }
        } else if (isMounted) {
          console.log('📱 No valid messages found');
          setMessages([]);
        }
      } catch (error) {
        console.error('❌ Error loading chat data:', error);
      } finally {
        // ALWAYS clear loading state if component is still mounted
        if (isMounted) {
          console.log('✅ Finished chat data load - CLEARING LOADING STATE');
          setLoading(false);
        }
      }
    };
    
    // Run the data loading function
    loadData();
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up data load effect');
      isMounted = false;
    };
  }, [chatId, userId]); // Minimize dependencies to prevent unnecessary reruns

  // ---------- OPTIMIZED SUBSCRIPTION LOGIC ----------
  
  // Track if this is the first mount with a ref to avoid duplicate subscriptions
  const hasSetupSubscription = React.useRef(false);
  
  // Use a different approach to subscription - only subscribe once
  useEffect(() => {
    if (!chatId || !userId || hasSetupSubscription.current) {
      return;
    }

    console.log('🔔 Setting up ONE-TIME subscription for chat:', chatId);
    hasSetupSubscription.current = true;
    
    // Use a more efficient message handler
    const handleNewMessage = (payload: any) => {
      console.log('📨 New message received:', payload?.new?.id || 'unknown');
      
      // Safety check - if payload is missing or malformed, do nothing
      if (!payload?.new) {
        console.log('⚠️ Invalid message payload received');
        return;
      }
      
      // Only fetch messages if we didn't just send this message ourselves
      // This avoids duplicate fetches when we send a message
      const newMessageSenderId = payload.new.sender_id;
      
      // Make sure we have the sender ID and it's not the current user
      if (newMessageSenderId && newMessageSenderId !== userId) {
        // We need to respect RLS policies - messages should only come from the patient or their doctor
        if (newMessageSenderId === doctorInfo.id) {
          console.log('📨 Message is from doctor, refreshing messages');
        
        // Fetch messages without setting loading state
        fetchChatMessages(chatId).then(messages => {
          if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.log('📨 No messages returned after refresh');
            return;
          }
          
          console.log(`📨 Updated with ${messages.length} messages`);  
          
          const formattedMessages = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.sender_id,
            createdAt: new Date(msg.created_at).toLocaleString(),
            isFromDoctor: msg.sender_id !== userId,
          }));
          
          setMessages(formattedMessages);
          
          // Mark messages as read if they're from the doctor
          // Use the doctorInfo from state instead of payload to get doctor_id
          if (doctorInfo.id) {
            console.log('📨 Marking messages from doctor as read');
            markMessagesAsRead(chatId, doctorInfo.id);
          }
          
          // Scroll to bottom after receiving new messages
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }).catch(error => {
          console.error('❌ Error fetching messages after notification:', error);
        });
        } else {
          console.log('⚠️ Message sender ID does not match doctor ID, ignoring');
        }
      } else {
        console.log('📨 Message is from current user (patient), skipping refresh');
      }
    };
    
    // Set up the subscription with our optimized handler
    const unsubscribe = subscribeToMessages(chatId, handleNewMessage);
    
    return () => {
      console.log('🔕 Cleaning up subscription');
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chatId, userId, fetchChatMessages, doctorInfo, markMessagesAsRead, flatListRef]);


  

  // Send a new message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !chatId || !userId) {
      console.error('Cannot send message: missing data', { messageContent: newMessage, chatId, userId });
      return;
    }
    
    const messageContent = newMessage.trim();
    
    try {
      console.log('💬 Sending message to chat ID:', chatId);
      
      // Create optimistic message for instant display - matching Message type
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        senderId: userId,
        createdAt: new Date().toISOString(),
        isFromDoctor: false
      };
      
      // Add to local state immediately
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
      // Clear input field right away
      setNewMessage('');
      
      // Scroll to the bottom immediately
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 50);
      
      // Send to server in the background
      await sendChatMessage({ chatId, content: messageContent });
      console.log('✅ Message sent successfully to server');
      
      // Quietly fetch the latest messages to sync with server
      fetchChatMessages(chatId).catch(err => {
        console.error('Error refreshing messages after send:', err);
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Could show an error toast here but keep the message in UI with a status indicator
    }
  }, [chatId, userId, newMessage, sendChatMessage, flatListRef, fetchChatMessages]);

  // Helper function to check if we have valid messages data
  const hasValidData = !loading && doctorInfo.name && Array.isArray(messages);

  // Always reset loading after 10 seconds to prevent permanent loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('Force releasing loading state after timeout');
        setLoading(false);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-white`}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: `Dr. ${doctorInfo.name}`,
          headerTitleStyle: tw`font-semibold text-lg text-gray-800`,
          headerRight: () => (
            <Pressable 
              onPress={() => {
                // Could navigate to doctor profile in the future
                Alert.alert('Doctor Contact', `Phone: ${doctorInfo.phoneNumber || 'Not available'}`);
              }}
              style={tw`pr-4`}
            >
              <Ionicons name="information-circle-outline" size={24} color="#F97316" />
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={tw`mt-4 text-gray-600`}>Loading messages...</Text>
        </View>
      ) : !hasValidData ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CBD5E1" />
          <Text style={tw`mt-4 text-center text-lg text-gray-600`}>No messages available</Text>
          <Text style={tw`mt-2 text-center text-gray-500`}>Start a conversation with Dr. {doctorInfo.name}</Text>
          
          {/* DEV-ONLY: Debug information */}
          <View style={tw`mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50 w-full`}>
            <Text style={tw`text-xs text-gray-700 font-bold`}>Debug Info:</Text>
            <Text style={tw`text-xs text-gray-700`}>Chat ID: {chatId || 'undefined'}</Text>
            <Text style={tw`text-xs text-gray-700`}>Patient ID: {userId || 'undefined'}</Text>
            <Text style={tw`text-xs text-gray-700`}>Doctor ID: {doctorInfo.id || 'undefined'}</Text>
            <Text style={tw`text-xs text-gray-700`}>Messages count: {messages.length}</Text>
            <TouchableOpacity 
              style={tw`mt-2 bg-gray-200 p-2 rounded`}
              onPress={() => {
                console.log('Force refresh requested');
                setLoading(true);
                loadChatDataStable();
              }}
            >
              <Text style={tw`text-xs text-center text-gray-700`}>Force Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={tw`p-4 pb-2`}
            style={tw`flex-1`}
            inverted={false}
            ListEmptyComponent={() => (
              <View style={tw`flex-1 justify-center items-center py-10`}>
                <Ionicons name="chatbubble-outline" size={48} color="#CBD5E1" />
                <Text style={tw`text-gray-400 text-center mt-4`}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            )}
            onLayout={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            renderItem={({ item }) => (
              <View 
                style={tw`mb-3 ${item.isFromDoctor ? 'items-start' : 'items-end'}`}
              >
                <View 
                  style={tw`max-w-[80%] rounded-lg px-3 py-2 ${
                    item.isFromDoctor ? 'bg-gray-100 rounded-tl-none' : 'bg-orange-100 rounded-tr-none'
                  }`}
                >
                  <Text style={tw`${item.isFromDoctor ? 'text-gray-800' : 'text-gray-800'}`}>
                    {item.content}
                  </Text>
                </View>
                <Text style={tw`text-xs text-gray-400 mt-1`}>
                  {item.createdAt}
                </Text>
              </View>
            )}
          />

          <View style={tw`p-2 border-t border-gray-200 bg-white`}>
            <View style={tw`flex-row items-center`}>
              <TextInput
                style={tw`flex-1 rounded-full px-4 py-2 bg-gray-100 text-gray-800 mr-2`}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity
                style={tw`h-10 w-10 rounded-full bg-orange-500 justify-center items-center ${
                  !newMessage.trim() || isSending ? 'opacity-50' : ''
                }`}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
              >
                <Ionicons name="send" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
});

export default ChatDetailScreen;
