import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useProfile, useUpdateProfile, defaultFormData } from '../hooks/useProfile';

export default function ProfileSettings() {
  const router = useRouter();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  // Update form when profile data changes
  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        specialization: profile.specialization || '',
        qualification: profile.qualification || '',
        years_of_experience: profile.years_of_experience || 0,
        hospital_affiliation: profile.hospital_affiliation || '',
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: field === 'years_of_experience' ? parseInt(value) || 0 : value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateProfile(formData);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`text-gray-500`}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <Stack.Screen
        options={{
          title: 'Profile Settings',
          headerRight: () => hasChanges ? (
            <TouchableOpacity 
              onPress={handleSave}
              disabled={isUpdating}
              style={tw`px-4 py-2 rounded-full bg-sky-500`}
            >
              <Text style={tw`text-white font-medium`}>
                {isUpdating ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ) : null,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#0284c7" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={tw`flex-1 p-4`}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={tw`space-y-4`}
        >
          <View>
            <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>Full Name</Text>
            <TextInput
              value={formData.full_name}
              onChangeText={(value) => handleChange('full_name', value)}
              style={tw`bg-gray-50 p-3 rounded-lg border border-gray-200`}
              placeholder="Enter your full name"
            />
          </View>

          <View>
            <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>Specialization</Text>
            <TextInput
              value={formData.specialization}
              onChangeText={(value) => handleChange('specialization', value)}
              style={tw`bg-gray-50 p-3 rounded-lg border border-gray-200`}
              placeholder="e.g. Cardiology, Pediatrics"
            />
          </View>

          <View>
            <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>Qualification</Text>
            <TextInput
              value={formData.qualification}
              onChangeText={(value) => handleChange('qualification', value)}
              style={tw`bg-gray-50 p-3 rounded-lg border border-gray-200`}
              placeholder="e.g. MBBS, MD"
            />
          </View>

          <View>
            <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>Years of Experience</Text>
            <TextInput
              value={formData.years_of_experience.toString()}
              onChangeText={(value) => handleChange('years_of_experience', value)}
              style={tw`bg-gray-50 p-3 rounded-lg border border-gray-200`}
              placeholder="Enter years of experience"
              keyboardType="number-pad"
            />
          </View>

          <View>
            <Text style={tw`text-sm font-medium text-gray-700 mb-1`}>Hospital Affiliation</Text>
            <TextInput
              value={formData.hospital_affiliation}
              onChangeText={(value) => handleChange('hospital_affiliation', value)}
              style={tw`bg-gray-50 p-3 rounded-lg border border-gray-200`}
              placeholder="Enter hospital affiliation"
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
