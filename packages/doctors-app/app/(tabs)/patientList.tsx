
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDoctorAuth } from '@/context/doctor-auth';
import { useDoctorContacts, PatientProfile } from '@/lib/doctor_contact';
import tw from '@/lib/tailwind';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import React, { ReactNode } from 'react';

export default function PatientList() {
    const {user, loading: authLoading} = useDoctorAuth()
    const { data: contacts, isLoading: contactsLoading, error } = useDoctorContacts(user?.id);

    const AnimatedState = ({ children, delay = 0 }: { children: ReactNode, delay?: number }) => (
      <Animated.View 
        entering={FadeInDown.duration(400).delay(delay)}
        exiting={FadeOutUp.duration(200)}
        layout={Layout.springify()}
      >
        {children}
      </Animated.View>
    );

    if (authLoading) {
      return (
        <AnimatedState>
          <View style={tw`p-4 border-t border-gray-100`}>
            <Text style={tw`text-sm font-medium text-gray-500`}>Loading auth...</Text>
          </View>
        </AnimatedState>
      );
    }

    if (!user?.id) {
      return (
        <AnimatedState>
          <View style={tw`p-4 border-t border-gray-100`}>
            <Text style={tw`text-sm font-medium text-gray-500`}>No user ID available</Text>
          </View>
        </AnimatedState>
      );
    }

    if (contactsLoading) {
      return (
        <AnimatedState>
          <View style={tw`p-4 border-t border-gray-100`}>
            <Text style={tw`text-sm font-medium text-gray-500`}>Loading patients...</Text>
          </View>
        </AnimatedState>
      );
    }

    if (error) {
      return (
        <AnimatedState>
          <View style={tw`p-4 border-t border-gray-100`}>
            <Text style={tw`text-sm font-medium text-red-500`}>Error: {error.message}</Text>
          </View>
        </AnimatedState>
      );
    }

    return (
      <AnimatedState>
        <View style={tw`p-4 border-t border-gray-100`}>
          <Text style={tw`text-sm font-semibold mb-3`}>Your Patients</Text>
          
          {!contacts?.length ? (
            <AnimatedState delay={200}>
              <View style={tw`bg-gray-50 rounded-lg p-4 items-center justify-center`}>
                <Ionicons name="people" size={24} color="#9ca3af" style={tw`mb-2`} />
                <Text style={tw`text-gray-500 text-sm text-center`}>No patients added yet</Text>
              </View>
            </AnimatedState>
          ) : (
            <Animated.View layout={Layout.springify()}>
              {contacts.map((contact, index) => {
                const profile = contact.patient.patient_profiles;
                return (
                  <Animated.View
                    key={contact.id}
                    entering={FadeInDown.duration(400).delay(index * 100)}
                    exiting={FadeOutUp.duration(200)}
                    layout={Layout.springify()}
                  >
                    <TouchableOpacity 
                      onPress={async () => {
                        // Add haptic feedback
                        if (Platform.OS === 'ios') {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        // Slight delay for feedback
                        setTimeout(() => {
                          router.push(`/chat/${contact.patient_id}`);
                        }, 50);
                      }}
                      style={tw`flex-row items-center p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2`}
                      activeOpacity={0.7}
                    >
                      <View style={tw`h-10 w-10 rounded-full bg-sky-100 items-center justify-center`}>
                        <Ionicons name="person" size={20} color="#0284c7" />
                      </View>
                      <View style={tw`ml-3 flex-1`}>
                        <Text style={tw`text-gray-900 font-medium text-sm`}>{(profile as any).full_name}</Text>
                        <Text style={tw`text-gray-500 text-xs mt-0.5`}>
                          {(profile as any).gender || 'Not specified'} 
                          {(profile as any).blood_group && ` • ${(profile as any).blood_group}`}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}
        </View>
      </AnimatedState>
    );
  }