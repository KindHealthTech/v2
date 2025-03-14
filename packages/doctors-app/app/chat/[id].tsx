import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '@kht/shared';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '@/lib/chat';
import tw from '@/lib/tailwind';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth';
import { useDoctorAuth } from '@/context/doctor-auth';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  // Force patientId to be a string
  const patientId = params.id ? String(params.id) : null;
  
  // Add direct debugging of parameters
  console.log('Chat screen mounted with raw params:', JSON.stringify(params));
  console.log('Extracted patientId:', patientId);
  
  const { user } = useDoctorAuth();
  console.log('Current user from auth:', user ? JSON.stringify(user) : 'No user');
  
  // Check login status
  useEffect(() => {
    if (!user) {
      console.log('No user logged in, redirecting...');
      alert('You must be logged in to access this page');
      // Could add navigation here if needed
    }
  }, [user]);
  
  const router = useRouter();
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Configure navigation animation
    navigation.setOptions({
      animation: 'slide_from_right',
      animationDuration: 300,
    });
  }, []);
  
  // Prepare IDs for chat hook - use non-null assertions where we're confident
  const patientIdString = patientId || '';
  const doctorIdString = user?.id || '';
  
  console.log('Calling useChat with:', { 
    patientIdString: patientIdString || 'MISSING', 
    doctorIdString: doctorIdString || 'MISSING' 
  });
  
  const {
    chat,
    messages,
    sendMessage,
    isLoading,
    isSending,
    subscribeToMessages,
  } = useChat(patientIdString, doctorIdString);
  
  console.log('Chat hook result:', { 
    chatExists: !!chat, 
    chatId: chat?.id, 
    messageCount: messages?.length
  });

  // Log state for debugging
  useEffect(() => {
    console.log('Chat component mounted with patientId:', patientId);
    console.log('Current user ID:', user?.id);
    return () => console.log('Chat component unmounted');
  }, []);

  // Subscribe to messages
  useEffect(() => {
    console.log('Chat ID changed:', chat?.id);
    if (chat?.id && typeof subscribeToMessages === 'function') {
      console.log('Subscribing to messages for chat:', chat.id);
      try {
        const unsubscribe = subscribeToMessages(chat.id);
        return () => {
          console.log('Unsubscribing from messages');
          unsubscribe();
        };
      } catch (error) {
        console.error('Error subscribing to messages:', error);
      }
    } else {
      console.log('Not subscribing to messages - missing chat ID or subscription function');
    }
  }, [chat?.id, subscribeToMessages]);

  // Create a direct test message function
  const createDirectChat = async () => {
    if (!doctorIdString) {
      console.error('Missing doctor ID');
      alert('Missing doctor ID! You need to be logged in as a doctor.');
      return;
    }
    
    if (!patientIdString) {
      console.error('Missing patient ID');
      alert('Missing patient ID! The URL parameter is missing.');
      return;
    }

    try {
      console.log('Attempting direct chat creation with:', { doctorIdString, patientIdString });
      
      // 1. Check if doctor_patient_contacts table exists
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .contains('tablename', 'doctor_patient_contacts');
        
      console.log('Tables check:', { tables, tablesError });
      
      // Try correct table name from your memory system
      const { error: contactError } = await supabase
        .from('patient_doctor_contacts')
        .insert({
          doctor_id: doctorIdString,
          patient_id: patientIdString,
          created_at: new Date().toISOString()
        });
      
      console.log('Contact creation result:', contactError ? 'Error' : 'Success');
      if (contactError) {
        console.error('Contact creation error:', contactError);
      } else {
        console.log('Contact created successfully');
      }

      // 3. Create chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          doctor_id: doctorIdString,
          patient_id: patientIdString
        })
        .select();
      
      console.log('Chat creation result:', chatData, chatError);
      
      if (chatError) {
        console.error('Chat creation error:', chatError);
        alert('Error creating chat: ' + chatError.message);
      } else {
        console.log('Chat created successfully:', chatData);
        
        // 4. Try sending a test message
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatData[0]?.id,
            sender_id: doctorIdString,
            content: 'Test message from direct operation'
          });
          
        console.log('Message creation result:', msgData, msgError);
        
        alert('Direct chat and message creation completed!');
      }
    } catch (err) {
      console.error('Direct operation error:', err);
      alert('Error in direct operation: ' + (err as Error).message);
    }
  };

  const handleSend = () => {
    if (message.trim() && !isSending) {
      if (!patientIdString || !doctorIdString) {
        console.error('Cannot send message: Missing patient or doctor ID');
        alert('Cannot send message: Missing patient or doctor ID');
        return;
      }
      
      console.log('Attempting to send message:', message.trim());
      console.log('Current state before sending:', { 
        patientId: patientIdString, 
        doctorId: doctorIdString,
        chatId: chat?.id 
      });
      
      try {
        // Always use the sendMessage function (which now handles chat creation internally)
        const messageContent = message.trim();
        sendMessage(messageContent);
        console.log('Message send function called with:', messageContent);
        setMessage('');
      } catch (error) {
        console.error('Error in handleSend:', error);
        alert('Failed to send message: ' + (error as Error).message);
      }
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages?.length) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages?.length]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`text-gray-500`}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-white`}
      keyboardVerticalOffset={100}
    >
      <Animated.View style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
      <Stack.Screen 
        options={{
          title: 'Chat',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              style={tw`ml-2`}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#0284c7" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#0284c7',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      
      <ScrollView
        ref={scrollViewRef}
        style={tw`flex-1 px-4`}
        contentContainerStyle={tw`pb-4 pt-2`}
      >
        {messages?.map((msg, index) => {
          const isMe = msg.sender_id === user?.id;
          const showDate = index === 0 || 
            new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();

          return (
            <View key={msg.id}>
              {showDate && (
                <Text style={tw`text-gray-400 text-xs text-center my-2`}>
                  {format(new Date(msg.created_at), 'MMMM d, yyyy')}
                </Text>
              )}
              <View style={tw`flex flex-row ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                <View style={tw`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-sky-500' : 'bg-gray-100'}`}>
                  <Text style={tw`${isMe ? 'text-white' : 'text-gray-900'}`}>
                    {msg.content}
                  </Text>
                  <Text style={tw`text-xs mt-1 ${isMe ? 'text-sky-100' : 'text-gray-500'}`}>
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={tw`border-t border-gray-200 px-4 py-3 bg-white`}>
        <View style={tw`flex-row items-center space-x-3`}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            style={tw`flex-1 bg-gray-100 rounded-full px-5 py-3 text-gray-800 text-base`}
            multiline
            maxLength={500}
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || isSending}
            style={tw`w-12 h-12 rounded-full bg-sky-500 items-center justify-center shadow-sm ${(!message.trim() || isSending) ? 'opacity-50' : ''}`}
            accessibilityLabel="Send message"
          >
            {isSending ? (
              <Text style={tw`text-white font-bold`}>...</Text>
            ) : (
              <Ionicons name="send" size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <View style={tw`flex-row justify-between mt-2`}>
          <TouchableOpacity 
            onPress={() => {
              const testMessage = 'Test message ' + new Date().toLocaleTimeString();
              console.log('Sending test message:', testMessage);
              sendMessage(testMessage);
            }}
            style={tw`px-4 py-2 bg-green-500 rounded-md`}
          >
            <Text style={tw`text-white font-medium text-sm`}>Send Test Message</Text>
          </TouchableOpacity>
          <Text style={tw`text-xs text-gray-500 self-center`}>
            Patient: {patientIdString?.substring(0,8)}... | Doctor: {doctorIdString?.substring(0,8)}...
          </Text>
        </View>
        {/* Debug info */}
        <Text style={tw`text-xs text-gray-400 mt-1`}>
          Chat ID: {chat?.id || 'Loading...'} | Messages: {messages?.length || 0}
        </Text>
      </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
