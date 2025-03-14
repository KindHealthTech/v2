import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { usePatientAuth } from '../../context/patient-auth';
import { Ionicons } from '@expo/vector-icons';
import { markProfileComplete, updatePatientProfile } from '../../lib/profile';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = usePatientAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    allergies: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.full_name.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      console.log('[handleSubmit] Updating profile for user:', user.id);
      
      // Format allergies as arrays if they contain values
      const allergiesArray = formData.allergies.trim() 
        ? formData.allergies.split(',').map(a => a.trim()) 
        : [];

      // Update the profile with the form data
      const { data, error } = await updatePatientProfile(user.id, {
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        blood_group: formData.blood_group || undefined,
        allergies: allergiesArray.length > 0 ? allergiesArray : undefined,
      });

      if (error) throw error;

      // Mark the profile as complete
      await markProfileComplete(user.id);
      
      console.log('[handleSubmit] Profile updated successfully:', data);
      
      // Navigation to home will be handled by the auth state listener in _layout.tsx
    } catch (error) {
      console.error('[handleSubmit] Error updating profile:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
            Complete Your Profile
          </Text>
          <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 8 }}>
            Let's get to know you better to personalize your experience
          </Text>
        </View>

        {/* Form Fields */}
        <FormField 
          label="Full Name" 
          placeholder="Enter your full name"
          value={formData.full_name}
          onChangeText={(value) => handleInputChange('full_name', value)}
          required
        />

        <FormField 
          label="Date of Birth" 
          placeholder="YYYY-MM-DD"
          value={formData.date_of_birth}
          onChangeText={(value) => handleInputChange('date_of_birth', value)}
          keyboardType="numbers-and-punctuation"
        />

        <FormField 
          label="Gender" 
          placeholder="Male, Female, or Other"
          value={formData.gender}
          onChangeText={(value) => handleInputChange('gender', value)}
        />

        <FormField 
          label="Blood Group" 
          placeholder="e.g., A+, B-, O+, AB+"
          value={formData.blood_group}
          onChangeText={(value) => handleInputChange('blood_group', value)}
        />

        <FormField 
          label="Allergies" 
          placeholder="Separate with commas (e.g., Peanuts, Penicillin)"
          value={formData.allergies}
          onChangeText={(value) => handleInputChange('allergies', value)}
          multiline
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !isFormValid()}
          style={{
            backgroundColor: isFormValid() ? '#0284c7' : '#cbd5e1',
            padding: 16,
            borderRadius: 10,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 20,
            marginBottom: 40,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                Complete Profile
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Form field component
interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'numbers-and-punctuation';
}

function FormField({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  required = false,
  multiline = false,
  keyboardType = 'default'
}: FormFieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '500', 
        color: '#334155', 
        marginBottom: 8 
      }}>
        {label} {required && <Text style={{ color: '#ef4444' }}>*</Text>}
      </Text>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        style={{ 
          borderWidth: 1, 
          borderColor: '#e2e8f0', 
          borderRadius: 10, 
          padding: 14,
          backgroundColor: '#f8fafc',
          fontSize: 16,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}
