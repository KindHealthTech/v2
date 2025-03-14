import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { usePatientAuth } from '@/context/patient-auth';
import { supabase } from '@/lib/profile';
import tw from '@/lib/tailwind';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { patientState } = usePatientAuth();
  const profile = patientState.patientProfile;

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              // Navigation to sign-in will be handled by the auth state listener
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const formatProfileField = (value: any) => {
    if (value === null || value === undefined) return 'Not provided';
    if (Array.isArray(value)) return value.join(', ') || 'None';
    return value;
  };

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      {/* Profile Header */}
      <View style={tw`items-center pt-8 pb-6 bg-orange-50`}>
        <View style={tw`h-24 w-24 rounded-full bg-orange-200 items-center justify-center mb-4`}>
          <Text style={tw`text-orange-700 font-bold text-3xl`}>
            {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'P'}
          </Text>
        </View>
        <Text style={tw`text-xl font-bold text-gray-800`}>
          {profile?.full_name || 'Patient'}
        </Text>
        <Text style={tw`text-sm text-gray-500 mt-1`}>
          {patientState.user?.phone || 'No phone number'}
        </Text>
      </View>

      {/* Profile Information */}
      <View style={tw`px-4 py-6`}>
        <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
          Personal Information
        </Text>
        
        <View style={tw`bg-white rounded-xl border border-gray-200 overflow-hidden`}>
          <ProfileItem 
            label="Date of Birth" 
            value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'} 
            icon="calendar-outline" 
          />
          
          <ProfileItem 
            label="Gender" 
            value={formatProfileField(profile?.gender)} 
            icon="person-outline" 
          />
          
          <ProfileItem 
            label="Blood Group" 
            value={formatProfileField(profile?.blood_group)} 
            icon="water-outline" 
          />
          
          <ProfileItem 
            label="Allergies" 
            value={formatProfileField(profile?.allergies)} 
            icon="alert-circle-outline" 
            isLast={true}
          />
        </View>
      </View>

      {/* Actions */}
      <View style={tw`px-4 py-6`}>
        <Text style={tw`text-lg font-semibold text-gray-800 mb-4`}>
          Account
        </Text>
        
        <TouchableOpacity 
          style={tw`flex-row items-center bg-white px-4 py-4 rounded-xl border border-gray-200 mb-3`}
          onPress={() => Alert.alert('Coming Soon', 'Edit profile functionality will be available soon.')}
        >
          <Ionicons name="create-outline" size={22} color="#4B5563" style={tw`mr-3`} />
          <Text style={tw`text-gray-800 font-medium flex-1`}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={tw`flex-row items-center bg-white px-4 py-4 rounded-xl border border-gray-200`}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" style={tw`mr-3`} />
          <Text style={tw`text-red-500 font-medium`}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={tw`px-4 py-6 items-center`}>
        <Text style={tw`text-gray-400 text-sm`}>
          Patient App v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

// Helper component for profile items
function ProfileItem({ 
  label, 
  value, 
  icon, 
  isLast = false 
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLast?: boolean;
}) {
  return (
    <View style={tw`px-4 py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <View style={tw`flex-row items-center mb-1`}>
        <Ionicons name={icon} size={16} color="#4B5563" style={tw`mr-2`} />
        <Text style={tw`text-gray-500 text-sm`}>{label}</Text>
      </View>
      <Text style={tw`text-gray-800 font-medium pl-6`}>{value}</Text>
    </View>
  );
}
