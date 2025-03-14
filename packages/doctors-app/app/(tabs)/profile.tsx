import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@kht/shared';
import tw from '@/lib/tailwind';
import { useDoctorAuth } from '@/context/doctor-auth';
import { useDoctorProfile } from '@/lib/profile';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, doctorProfile } = useDoctorAuth();
  const { data: profile, isLoading, error } = useDoctorProfile(user?.id);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth/sign-in');
    } catch (error) {
      console.error('[handleLogout] Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Profile Settings',
      icon: 'person' as any,
      route: '/settings/profile',
      description: 'Update your professional details',
    },
    {
      title: 'Availability',
      icon: 'time' as any,
      route: '/settings/availability',
      description: 'Set your working hours',
    },
    {
      title: 'About',
      icon: 'information-circle-outline' as any,
      route: null,
      onPress: () => Alert.alert('About', 'KHT - Your Medical History Tracker\nVersion 1.0.0'),
      description: 'App information and version',
    },
    {
      title: 'Logout',
      icon: 'log-out-outline' as any,
      route: null,
      onPress: handleLogout,
      description: 'Sign out of your account',
      danger: true,
    },
  ];

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <ActivityIndicator color="#0284c7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 items-center justify-center p-4`}>
        <Text style={tw`text-red-500 text-center`}>Error: {error.message}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={tw`flex-1 items-center justify-center p-4`}>
        <Text style={tw`text-gray-500 text-center`}>No profile found</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`}>
        {/* Profile Header */}
        <View style={tw`p-6 border-b border-gray-100`}>
          <View style={tw`items-center`}>
            <View style={tw`h-24 w-24 rounded-full bg-sky-100 items-center justify-center mb-4`}>
              <Ionicons name="person" size={40} color="#0284c7" />
            </View>
            <Text style={tw`text-xl font-semibold text-gray-900`}>{(profile as any).full_name}</Text>
            <Text style={tw`text-sm text-gray-500 mt-1`}>{(profile as any).specialization}</Text>
            {(profile as any).qualification && (
              <Text style={tw`text-xs text-gray-500 mt-1`}>{(profile as any).qualification}</Text>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={tw`p-4`}>
          <View style={tw`space-y-3`}>
            {menuItems.map((item, index) => (
              <Animated.View
                key={item.title}
                entering={FadeInDown.duration(400).delay(index * 100)}
              >
                <TouchableOpacity
                  onPress={() => item.route ? router.push(item.route) : item.onPress?.()}
                  style={tw`flex-row items-center p-4 bg-gray-50 rounded-lg border border-gray-100`}
                  disabled={loading && item.title === 'Logout'}
                >
                  <View style={[
                    tw`h-10 w-10 rounded-full items-center justify-center`,
                    item.danger ? tw`bg-red-100` : tw`bg-sky-100`
                  ]}>
                    <Ionicons 
                      name={item.icon} 
                      size={20} 
                      color={item.danger ? '#ef4444' : '#0284c7'} 
                    />
                  </View>
                  <View style={tw`ml-3 flex-1`}>
                    <Text style={[
                      tw`font-medium`,
                      item.danger ? tw`text-red-600` : tw`text-gray-900`
                    ]}>{item.title}</Text>
                    <Text style={tw`text-gray-500 text-sm mt-0.5`}>{item.description}</Text>
                  </View>
                  {item.route && <Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
