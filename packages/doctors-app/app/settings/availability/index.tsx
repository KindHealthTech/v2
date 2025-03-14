import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, TextInput, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useAvailability, useUpdateAvailability, defaultFormData } from '../hooks/useAvailability';

export default function AvailabilitySettings() {
  const router = useRouter();
  const [hasChanges, setHasChanges] = useState(false);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: availability, isLoading } = useAvailability();
  const { mutate: updateAvailability, isPending: isUpdating } = useUpdateAvailability();

  // Update form when availability data changes
  React.useEffect(() => {
    if (availability) {
      setFormData({
        status: availability.status,
        start_time: new Date(availability.start_time).getTime(),
        end_time: new Date(availability.end_time).getTime(),
        auto_response: availability.auto_response || defaultFormData.auto_response,
      });
    }
  }, [availability]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateAvailability(formData);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`text-gray-500`}>Loading availability settings...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <Stack.Screen
        options={{
          title: 'Availability Settings',
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
          style={tw`space-y-6`}
        >
          <View>
            <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>Availability Status</Text>
            <View style={tw`flex-row items-center justify-between bg-gray-50 p-4 rounded-lg`}>
              <Text style={tw`text-gray-600`}>Available for Consultations</Text>
              <Switch
                value={formData.status === 'available'}
                onValueChange={(value) => handleChange('status', value ? 'available' : 'unavailable')}
                trackColor={{ false: '#cbd5e1', true: '#0ea5e9' }}
              />
            </View>
          </View>

          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={[tw`space-y-3`, formData.status !== 'available' && tw`opacity-50`]}
          >
            <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>Working Hours</Text>
            <TouchableOpacity 
              onPress={() => formData.status === 'available' && setShowPicker('start')}
              style={tw`flex-row items-center justify-between bg-gray-50 p-4 rounded-lg`}
              disabled={formData.status !== 'available'}
            >
              <Text style={tw`text-gray-600`}>Start Time</Text>
              <Text style={tw`text-gray-900 font-medium`}>
                {format(new Date(formData.start_time), 'h:mm a')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => formData.status === 'available' && setShowPicker('end')}
              style={tw`flex-row items-center justify-between bg-gray-50 p-4 rounded-lg`}
              disabled={formData.status !== 'available'}
            >
              <Text style={tw`text-gray-600`}>End Time</Text>
              <Text style={tw`text-gray-900 font-medium`}>
                {format(new Date(formData.end_time), 'h:mm a')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View>
            <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>
              {formData.status === 'available' ? 'Out of Office Message' : 'Unavailability Message'}
            </Text>
            <TextInput
              value={formData.auto_response}
              onChangeText={(value) => handleChange('auto_response', value)}
              style={tw`bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[100px]`}
              placeholder="Enter message to be sent when you're unavailable"
              multiline
              textAlignVertical="top"
            />
          </View>
        </Animated.View>
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          value={new Date(showPicker === 'start' ? formData.start_time : formData.end_time)}
          mode="time"
          is24Hour={false}
          onChange={(event, selectedDate) => {
            setShowPicker(null);
            if (selectedDate && event.type === 'set') {
              handleChange(
                showPicker === 'start' ? 'start_time' : 'end_time',
                selectedDate.getTime()
              );
            }
          }}
        />
      )}
    </View>
  );
}
