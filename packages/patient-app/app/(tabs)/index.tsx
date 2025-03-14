import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePatientAuth } from '@/context/patient-auth';
import tw from '@/lib/tailwind';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { patientState } = usePatientAuth();
  const patientName = patientState.patientProfile?.full_name || 'Patient';
  
  const navigateToChats = () => {
    router.push('/chats');
  };

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      {/* Header with welcome message */}
      <View style={tw`px-4 pt-6 pb-4 bg-orange-50`}>
        <Text style={tw`text-2xl font-bold text-gray-800`}>
          Welcome, {patientName.split(' ')[0]}
        </Text>
        <Text style={tw`text-gray-600 mt-1`}>
          How are you feeling today?
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={tw`px-4 py-6`}>
        <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
          Quick Actions
        </Text>
        
        <View style={tw`flex-row flex-wrap -mx-2`}>
          <TouchableOpacity 
            style={tw`w-1/2 p-2`}
            onPress={navigateToChats}
          >
            <View style={tw`bg-blue-50 p-4 rounded-xl`}>
              <View style={tw`bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-3`}>
                <Ionicons name="chatbubble-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={tw`font-semibold text-gray-800`}>Chat with Doctor</Text>
              <Text style={tw`text-gray-500 text-sm mt-1`}>Message your doctor</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={tw`w-1/2 p-2`}>
            <View style={tw`bg-green-50 p-4 rounded-xl`}>
              <View style={tw`bg-green-100 w-12 h-12 rounded-full items-center justify-center mb-3`}>
                <Ionicons name="calendar-outline" size={24} color="#10B981" />
              </View>
              <Text style={tw`font-semibold text-gray-800`}>Appointments</Text>
              <Text style={tw`text-gray-500 text-sm mt-1`}>Coming soon</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Health Tips */}
      <View style={tw`px-4 py-6 bg-gray-50`}>
        <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
          Health Tips
        </Text>
        
        <View style={tw`bg-white rounded-xl p-4 shadow-sm border border-gray-100`}>
          <Text style={tw`font-semibold text-gray-800 mb-2`}>
            Stay Hydrated
          </Text>
          <Text style={tw`text-gray-600`}>
            Remember to drink at least 8 glasses of water daily to stay hydrated and maintain good health.
          </Text>
        </View>
      </View>

      {/* Coming Soon */}
      <View style={tw`px-4 py-6`}>
        <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
          Coming Soon
        </Text>
        
        <View style={tw`bg-orange-50 rounded-xl p-4 mb-4`}>
          <Text style={tw`font-semibold text-gray-800 mb-1`}>
            Medication Reminders
          </Text>
          <Text style={tw`text-gray-600 text-sm`}>
            Set reminders for your medications
          </Text>
        </View>
        
        <View style={tw`bg-purple-50 rounded-xl p-4`}>
          <Text style={tw`font-semibold text-gray-800 mb-1`}>
            Health Tracking
          </Text>
          <Text style={tw`text-gray-600 text-sm`}>
            Monitor your vital signs and health metrics
          </Text>
        </View>
      </View>

      {/* Footer spacing */}
      <View style={tw`h-8`} />
    </ScrollView>
  );
}
