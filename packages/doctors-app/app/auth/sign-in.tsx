import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { signInWithPhone, verifyOTP } from '../../lib/auth';
import tw from '../../lib/tailwind';
import { checkNewUser, createNewUser } from '@/lib/users';


export default function SignInScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithPhone(phoneNumber);
      
      if (error) throw error;
      
      setShowOTP(true);
      // For development, show the test OTP
      Alert.alert('Development Mode', 'Test OTP: 123456');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const { data: otpUser, error, } = await verifyOTP(phoneNumber, otpCode);
      if (error) throw error;
      if(!otpUser?.user) return 
      const { isNewUser } = await checkNewUser(otpUser?.user.id);
      if (isNewUser) {
        // create a new user in the users table 
        const { error } = await createNewUser(otpUser?.user.id, phoneNumber, 'doctor');
        if (error) throw error;
        // Redirect to onboarding if profile is not complete
        router.replace('/onboarding');
      } else {
        // Redirect to main app
        router.replace('/');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white p-6`}>
      <Stack.Screen options={{ 
        title: 'Doctor Sign In',
        headerShown: false 
      }} />
      
      <View style={tw`flex-1 justify-center`}>
        <View style={tw`mb-4`}>
          <Text style={tw`text-3xl font-bold text-gray-900 mb-2`}>
            Welcome, Doctor
          </Text>
          <Text style={tw`text-lg text-gray-600`}>
            {showOTP 
              ? 'Enter the verification code sent to your phone'
              : 'Sign in to access your patient chats'
            }
          </Text>
        </View>

        <View style={tw`mb-6`}>
          {!showOTP ? (
            <View>
              <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>
                Phone Number
              </Text>
              <TextInput
                style={tw`w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 text-base`}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+1 234 567 8901"
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          ) : (
            <View>
              <Text style={tw`text-lg font-semibold text-gray-700 mb-2`}>
                Verification Code
              </Text>
              <TextInput
                style={tw`w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 text-base`}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="Enter verification code"
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={tw`w-full py-4 rounded-lg bg-orange-500 ${loading ? 'opacity-70' : ''}`}
          onPress={showOTP ? handleVerifyOTP : handleSendOTP}
          disabled={loading}
        >
          <Text style={tw`text-center text-white text-base font-semibold`}>
            {loading
              ? 'Please wait...'
              : showOTP
              ? 'Verify Code'
              : 'Send Verification Code'
            }
          </Text>
        </TouchableOpacity>

        {showOTP && (
          <TouchableOpacity 
            style={tw`mt-4`}
            onPress={() => setShowOTP(false)}
            disabled={loading}
          >
            <Text style={tw`text-center text-primary text-sm`}>
              Change phone number
            </Text>
          </TouchableOpacity>
        )}

        <Text style={tw`text-center text-sm text-gray-500 mt-4`}>
          {showOTP
            ? 'Didn\'t receive the code? Check your phone number'
            : 'You will receive a verification code on your phone number'
          }
        </Text>
      </View>
    </View>
  );
}
