import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@kht/shared';
import tw from '../../lib/tailwind';

export default function SignInScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Normalize the phone number format
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    setLoading(true);
    try {
      console.log('[handleSendOTP] Sending OTP to phone:', formattedPhone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      setShowOtpInput(true);
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (error) {
      console.error('[handleSendOTP] Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    // Normalize the phone number format
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    setVerifying(true);
    try {
      console.log('[handleVerifyOTP] Verifying OTP for phone:', formattedPhone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: verificationCode,
        type: 'sms',
      });

      if (error) throw error;

      console.log('[handleVerifyOTP] Auth success:', data);
      console.log('[handleVerifyOTP] 🔑 AUTHENTICATION SUCCESSFUL - Waiting for auth listener to redirect...');
      // Add timestamp to track how long it takes for the redirect to happen
      console.log('[handleVerifyOTP] Timestamp:', new Date().toISOString());
      // Navigation will be handled by the _layout.tsx auth state listener
    } catch (error) {
      console.error('[handleVerifyOTP] Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Invalid verification code');
    } finally {
      // Always reset the loading state, whether verification succeeds or fails
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: 'white' }}
    >
      <StatusBar style="dark" />
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 }}>
            Welcome to Patient App
          </Text>
          <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center' }}>
            Your personal health tracking assistant
          </Text>
        </View>

        {/* Phone Input */}
        {!showOtpInput ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#334155', marginBottom: 8 }}>
              Phone Number
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              borderWidth: 1, 
              borderColor: '#e2e8f0', 
              borderRadius: 10, 
              padding: 14,
              marginBottom: 20,
              backgroundColor: '#f8fafc'
            }}>
              <TextInput 
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoFocus
                style={tw`w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 text-base`}
              />
            </View>

            <TouchableOpacity
              onPress={handleSendOTP}
              disabled={loading}
              style={{
                backgroundColor: '#0284c7',
                padding: 16,
                borderRadius: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                    Send Verification Code
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#334155', marginBottom: 8 }}>
              Verification Code
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              borderWidth: 1, 
              borderColor: '#e2e8f0', 
              borderRadius: 10, 
              padding: 14,
              marginBottom: 20,
              backgroundColor: '#f8fafc'
            }}>
              <TextInput
                placeholder="Enter verification code"
                keyboardType="number-pad"
                value={verificationCode}
                onChangeText={setVerificationCode}
                style={{ flex: 1, fontSize: 16 }}
                autoFocus
              />
            </View>

            <TouchableOpacity
              onPress={handleVerifyOTP}
              disabled={verifying}
              style={{
                backgroundColor: '#0284c7',
                padding: 16,
                borderRadius: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              {verifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                    Verify Code
                  </Text>
                  <Ionicons name="checkmark" size={20} color="white" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowOtpInput(false);
                setVerificationCode('');
              }}
              style={{
                padding: 16,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#64748b', fontSize: 16 }}>
                Change Phone Number
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
