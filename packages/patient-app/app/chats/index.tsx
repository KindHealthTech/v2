import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { usePatientAuth } from '@/context/patient-auth';
import { usePatientChat } from '@/lib/chat';
import tw from '@/lib/tailwind';
import { Ionicons } from '@expo/vector-icons';

// Define the shape of data returned from Supabase
type DoctorProfile = {
  full_name: string;
};

type Doctor = {
  id: string;
  doctor_profiles: DoctorProfile[];
};

type ChatData = {
  id: string;
  doctor_id: string;
  last_message_at: string | null;
  doctor: Doctor;
};

// Our app's internal representation
type ChatPreview = {
  id: string;
  doctorId: string;
  doctorName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
};

export default function ChatsScreen() {
  const router = useRouter();
  const { patientState } = usePatientAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use the new hook for chat operations
  const { 
    chats: chatData, 
    isLoading: chatsLoading, 
    refetchChats 
  } = usePatientChat(patientState.user?.id);

  // Handle manual refresh action
  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('Manual refresh triggered');
    await refetchChats();
  };

  // Process data only when chat data is available and not during loading
  useEffect(() => {
    console.log('Effect triggered: chatsLoading =', chatsLoading, 'chatData length =', chatData?.length);
    
    // Only update if we're not already loading and data changed
    if (!chatsLoading) {
      if (chatData !== undefined) {
        // Create local snapshot of data to process
        const localChatData = [...chatData];
        console.log('Processing chats snapshot, length:', localChatData.length);
        
        // Map the data to our ChatPreview format
        try {
          const formattedChats: ChatPreview[] = localChatData.map((chat: any) => {
            // Extract doctor name from the nested join structure
            let doctorName = 'Unknown Doctor';
            console.log('Doctor data for chat', chat.id, ':', JSON.stringify(chat.doctor, null, 2));
            
            // Supabase can return doctor_profiles as an object or array depending on the query
            // We need to handle both cases
            const doctor = chat.doctor as any; // Use any to bypass type restrictions
            
            if (doctor && doctor.doctor_profiles) {
              if (Array.isArray(doctor.doctor_profiles)) {
                if (doctor.doctor_profiles.length > 0 && doctor.doctor_profiles[0].full_name) {
                  console.log('Found doctor profile with name from array:', doctor.doctor_profiles[0].full_name);
                  doctorName = doctor.doctor_profiles[0].full_name;
                }
              } else if (typeof doctor.doctor_profiles === 'object' && doctor.doctor_profiles !== null) {
                // It could be a direct object instead of an array
                if (doctor.doctor_profiles.full_name) {
                  console.log('Found doctor profile with name from object:', doctor.doctor_profiles.full_name);
                  doctorName = doctor.doctor_profiles.full_name;
                }
              }
            } else if (doctor) {
              console.log('Doctor record exists but no profiles');
              // As a fallback, try to get name from the users table if available
              if (doctor.full_name) {
                doctorName = doctor.full_name;
              }
            } else {
              console.log('No doctor data available for this chat');
            }
            
            return {
              id: chat.id,
              doctorId: chat.doctor_id,
              doctorName,
              lastMessageTime: chat.last_message_at ? new Date(chat.last_message_at).toLocaleString() : undefined,
            };
          });
          
          console.log('Setting', formattedChats.length, 'processed chats');
          setChats(formattedChats);
        } catch (error) {
          console.error('Error processing chats:', error);
        }
      }
      
      // Always clear loading states when data processing is complete
      console.log('Clearing loading states');
      setLoading(false);
      setRefreshing(false);
    }
  }, [chatData, chatsLoading]);
  
  // Remove the separate processChats function and move its logic into the effect

  // Initial load - only set loading state if we don't already have data
  useEffect(() => {
    console.log('Patient user ID changed:', patientState.user?.id, 'chatData:', chatData ? 'exists' : 'none');
    if (patientState.user?.id && !chatData) {
      console.log('Setting loading to true on initial load');
      setLoading(true);
    }
  }, [patientState.user?.id, chatData]);
  
  // Handle refresh action
  const onRefresh = async () => {
    // Use our handleRefresh function to ensure consistent behavior
    await handleRefresh();
  };

  const navigateToChat = (chatId: string, doctorName: string) => {
    // Make sure the doctor name is properly encoded and URL is correctly formatted
    const encodedName = encodeURIComponent(doctorName || 'Unknown Doctor');
    console.log(`Navigating to chat with ID ${chatId} and doctor name ${doctorName}`);
    router.push({
      pathname: `/chats/${chatId}`,
      params: { doctorName: encodedName }
    });
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <Stack.Screen
        options={{
          title: 'Your Conversations',
          headerTitleStyle: tw`font-semibold text-lg text-gray-800`,
        }}
      />

      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : chats.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Ionicons name="chatbubble-ellipses-outline" size={64} color="#CBD5E1" />
          <Text style={tw`text-gray-500 text-center mt-4 text-lg`}>
            No conversations yet
          </Text>
          <Text style={tw`text-gray-400 text-center mt-2`}>
            Your doctor will initiate a chat with you when needed
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={tw`border-b border-gray-100 px-4 py-3`}
              onPress={() => navigateToChat(item.id, item.doctorName)}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`h-12 w-12 rounded-full bg-orange-100 justify-center items-center mr-3`}>
                  <Text style={tw`text-orange-600 font-semibold text-lg`}>
                    {item.doctorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <Text style={tw`font-semibold text-gray-800 text-base`}>
                      Dr. {item.doctorName}
                    </Text>
                    {item.lastMessageTime && (
                      <Text style={tw`text-gray-400 text-xs`}>
                        {item.lastMessageTime}
                      </Text>
                    )}
                  </View>
                  <View style={tw`flex-row items-center justify-between mt-1`}>
                    <Text 
                      style={tw`text-gray-500 text-sm ${item.unreadCount ? 'font-semibold' : ''}`}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.lastMessage || 'No messages yet'}
                    </Text>
                    {item.unreadCount ? (
                      <View style={tw`bg-orange-500 rounded-full px-2 py-0.5 ml-2`}>
                        <Text style={tw`text-white text-xs font-bold`}>{item.unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
