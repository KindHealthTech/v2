import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import tw from '../lib/tailwind';
import { supabase } from '@kht/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/context/auth';
import { 
  ProfileFormData, 
  AvailabilityFormData, 
  OnboardingStep 
} from '../types/onboarding';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getCurrentUser } from '@/lib/users';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  specialization: z.string().min(3, 'Specialization is required'),
  qualification: z.string().min(2, 'Qualification is required'),
  years_of_experience: z.number().min(0, 'Experience can\'t be negative'),
  is_profile_complete: z.boolean().optional()
});

const availabilitySchema = z.object({
  status: z.enum(['available', 'unavailable']),
  start_time: z.date(),
  end_time: z.date(),
  auto_response: z.string().optional()
});


type FormValues = z.infer<typeof profileSchema> & z.infer<typeof availabilitySchema>;

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
 // Get the user object from the auth hook
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile');

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(profileSchema.merge(availabilitySchema)),
    defaultValues: {
      full_name: '',
      specialization: '',
      qualification: '',
      years_of_experience: 0,
      status: 'available',
      start_time: new Date(),
      end_time: new Date(),
      auto_response: ''
    }
  });
  const currentUser =  getCurrentUser();


  const onSubmit = handleSubmit(async (data) => {
   
    setLoading(true);
    try {
      if (currentStep === 'profile') {
        await supabase
          .from('doctor_profiles')
          .upsert({
            id: (await currentUser).data?.auth?.id,
            full_name: data.full_name,
            specialization: data.specialization,
            qualification: data.qualification,
            years_of_experience: data.years_of_experience,
            is_profile_complete: false
          });
        setCurrentStep('availability');
      } else {
        await supabase
          .from('doctor_availability')
          .upsert({
            doctor_id: (await currentUser).data?.database.id,
            status: data.status,
            start_time: data.start_time,
            end_time: data.end_time,
            auto_response: data.auto_response
          });

        await supabase
          .from('doctor_profiles')
          .update({ is_profile_complete: true })
          .eq('id', (await currentUser).data?.database.id);

        router.replace('/');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save profile'
      );
    } finally {
      setLoading(false);
    }
  });

  const ProfileForm = () => (
    <View style={tw`mb-6`}>
      <Controller
        name="full_name"
        control={control}
        render={({ field }) => (
          <View style={tw`mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Full Name</Text>
            <TextInput
              style={tw`w-full px-4 py-3 rounded-lg border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} text-gray-700 text-base`}
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Enter your full name"
              autoCapitalize="words"
              editable={!loading}
            />
            {errors.full_name && (
              <Text style={tw`text-red-500 mt-1`}>{errors.full_name.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        name="specialization"
        control={control}
        render={({ field }) => (
          <View style={tw`mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Specialization</Text>
            <TextInput
              style={tw`w-full px-4 py-3 rounded-lg border ${errors.specialization ? 'border-red-500' : 'border-gray-300'} text-gray-700 text-base`}
              value={field.value}
              onChangeText={field.onChange}
              placeholder="e.g., Cardiologist, General Physician"
              editable={!loading}
            />
            {errors.specialization && (
              <Text style={tw`text-red-500 mt-1`}>{errors.specialization.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        name="qualification"
        control={control}
        render={({ field }) => (
          <View style={tw`mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Qualification</Text>
            <TextInput
              style={tw`w-full px-4 py-3 rounded-lg border ${errors.qualification ? 'border-red-500' : 'border-gray-300'} text-gray-700 text-base`}
              value={field.value}
              onChangeText={field.onChange}
              placeholder="e.g., MBBS, MD"
              editable={!loading}
            />
            {errors.qualification && (
              <Text style={tw`text-red-500 mt-1`}>{errors.qualification.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        name="years_of_experience"
        control={control}
        render={({ field }) => (
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Years of Experience</Text>
            <TextInput
              style={tw`w-full px-4 py-3 rounded-lg border ${errors.years_of_experience ? 'border-red-500' : 'border-gray-300'} text-gray-700 text-base`}
              value={field.value.toString()}
              onChangeText={(text) => field.onChange(parseInt(text))}
              placeholder="Enter number of years"
              keyboardType="number-pad"
              editable={!loading}
            />
            {errors.years_of_experience && (
              <Text style={tw`text-red-500 mt-1`}>{errors.years_of_experience.message}</Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        style={tw`w-full bg-blue-600 py-3 rounded-lg ${loading ? 'opacity-50' : ''}`}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>
          {loading ? 'Saving...' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const AvailabilityForm = () => (
    <View style={tw`mb-6`}>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <View style={tw`mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Availability Status</Text>
            <TouchableOpacity
              style={tw`w-full px-4 py-3 rounded-lg border border-gray-300 
                ${field.value === 'available' ? 'bg-green-100 border-green-500' : ''}`}
              onPress={() => field.onChange('available')}
            >
              <Text style={tw`text-center text-base ${field.value === 'available' ? 'text-green-700' : 'text-gray-700'}`}>
                Available
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 
                ${field.value === 'unavailable' ? 'bg-red-100 border-red-500' : ''}`}
              onPress={() => field.onChange('unavailable')}
            >
              <Text style={tw`text-center text-base ${field.value === 'unavailable' ? 'text-red-700' : 'text-gray-700'}`}>
                Unavailable
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Controller
        name="start_time"
        control={control}
        render={({ field }) => (
          <View style={tw`mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Available From</Text>
            <DateTimePicker
              value={field.value}
              mode="datetime"
              display="default"
              onChange={(event, date) => {
                if (date) field.onChange(date);
              }}
            />
          </View>
        )}
      />

      <Controller
        name="end_time"
        control={control}
        render={({ field }) => (
          <View style={tw`mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Available Until</Text>
            <DateTimePicker
              value={field.value}
              mode="datetime"
              display="default"
              onChange={(event, date) => {
                if (date) field.onChange(date);
              }}
            />
          </View>
        )}
      />

      {control._formValues.status === 'unavailable' && (
        <Controller
          name="auto_response"
          control={control}
          render={({ field }) => (
            <View style={tw`mb-4`}>
              <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>Auto Response Message</Text>
              <TextInput
                style={tw`w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 text-base`}
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Message to show when you're unavailable"
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={tw`w-full bg-blue-600 py-3 rounded-lg ${loading ? 'opacity-50' : ''}`}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>
          {loading ? 'Completing Setup...' : 'Complete Setup'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'profile':
        return <ProfileForm />;
      case 'availability':
        return <AvailabilityForm />;
      default:
        return null;
    }
  };

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      <Stack.Screen options={{ 
        title: currentStep === 'profile' ? 'Complete Your Profile' : 'Set Your Availability',
        headerShown: false 
      }} />
      
      <View style={tw`p-6`}>
        <View style={tw`mb-8`}>
          <Text style={tw`text-3xl font-bold text-gray-900 mb-2`}>
            {currentStep === 'profile' ? 'Complete Your Profile' : 'Set Your Availability'}
          </Text>
          <Text style={tw`text-lg text-gray-600`}>
            {currentStep === 'profile' 
              ? 'Please provide your professional details to get started'
              : 'Set your initial availability schedule'
            }
          </Text>
        </View>

        {renderStep()}
      </View>
    </ScrollView>
  );
}
