import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@kht/shared';
import { useDoctorAuth } from '@/context/doctor-auth';
import tw from '@/lib/tailwind';
import PatientList from './patientList';

export default function MainScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const checkPatientAndSendInvite = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');
    
    setLoading(true);
    try {
      console.log('[checkPatientAndSendInvite] Looking up patient with phone:', normalizedPhone);
      
      // Get current doctor
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if patient exists
      const { data: patient, error: patientError } = await supabase
        .from('users')
        .select('id, role')
        .eq('phone_number', normalizedPhone)
        .eq('role', 'patient')
        .single();

      if (patientError && patientError.code !== 'PGRST116') {
        throw patientError;
      }

      if (!patient) {
        console.log('[checkPatientAndSendInvite] Patient not found, sending invite');
        // Patient not found, send invite via SMS
        const inviteMessage = `Join me on KHT to better monitor your medical history. Download the app here: [App Store Link]`;
        const smsUrl = `sms:${normalizedPhone}?body=${encodeURIComponent(inviteMessage)}`;
        
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (!canOpen) {
          throw new Error('Cannot open SMS app');
        }

        await Linking.openURL(smsUrl);
        return;
      }

      console.log('[checkPatientAndSendInvite] Patient found:', patient.id);

      // Check if contact already exists
      const { data: existingContact, error: contactError } = await supabase
        .from('doctor_patient_contacts')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('patient_id', patient.id)
        .single();

      if (contactError && contactError.code !== 'PGRST116') {
        throw contactError;
      }

      if (existingContact) {
        console.log('[checkPatientAndSendInvite] Contact already exists');
        Alert.alert('Info', 'This patient is already in your contacts');
        return;
      }

      // Add new contact
      console.log('[checkPatientAndSendInvite] Adding new contact');
      const { error: insertError } = await supabase
        .from('doctor_patient_contacts')
        .insert({
          doctor_id: user.id,
          patient_id: patient.id
        });

      if (insertError) throw insertError;

      Alert.alert('Success', 'Patient added to your contacts');
      setPhoneNumber(''); // Clear input
    } catch (error) {
      console.error('[checkPatientAndSendInvite] Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <Stack.Screen 
        options={{
          title: 'Doctor Dashboard',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Add Patient Section */}
        <View style={tw`p-4`}>
          <View style={tw`bg-sky-50 rounded-lg p-4`}>
            <Text style={tw`text-sm font-semibold mb-3`}>Add Patient</Text>
            <TextInput
              style={tw`bg-white border border-gray-200 rounded-md p-2 mb-3 text-sm`}
              placeholder="Enter patient phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!loading}
            />
            <TouchableOpacity
              style={tw`bg-sky-600 rounded-md p-3 flex-row items-center justify-center ${
                loading ? 'opacity-50' : ''
              }`}
              onPress={checkPatientAndSendInvite}
              disabled={loading}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" style={tw`mr-2`} />
              <Text style={tw`text-white text-sm font-medium`}>
                {loading ? 'Processing...' : 'Add Patient or Send Invite'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient List */}
        <PatientList />
      </ScrollView>
    </View>
  );
}
