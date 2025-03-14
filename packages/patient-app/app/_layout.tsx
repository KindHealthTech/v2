import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PatientAuthProvider, usePatientAuth } from '@/context/patient-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// If using Expo Router, import your CSS file in the app/_layout.tsx file
import '../global.css';

// Create a client for React Query
const queryClient = new QueryClient();

// Inner component that handles navigation based on auth state
function NavigationController() {
  const { session, loading, needsOnboarding, user } = usePatientAuth();
  const segments = useSegments();
  const router = useRouter();

  // Log auth state for debugging
  useEffect(() => {
    console.log('[NavigationController] Auth state:', { 
      isAuthenticated: !!session, 
      userId: user?.id,
      needsOnboarding, 
      loading,
      currentSegment: segments[0]
    });
  }, [session, user, needsOnboarding, loading, segments]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (loading) {
      console.log('[NavigationController] Still loading auth state...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    
    console.log('[NavigationController] 🔸 NAVIGATION CHECK:', {
      inAuthGroup,
      inOnboarding,
      hasSession: !!session,
      needsOnboarding,
      currentSegment: segments[0],
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
    
    if (!session && !inAuthGroup) {
      // Not authenticated, redirect to sign in
      console.log('[NavigationController] Redirecting to sign-in');
      // Use a short timeout to ensure the navigation happens after the render cycle
      setTimeout(() => router.replace('/auth/sign-in'), 50);
    } else if (session && inAuthGroup) {
      // Authenticated but in auth group, redirect appropriately
      const destination = needsOnboarding ? '/onboarding' : '/';
      console.log(`[NavigationController] Authenticated in auth group, redirecting to ${destination}`);
      // Use a short timeout to ensure the navigation happens after the render cycle
      setTimeout(() => router.replace(destination), 50);
    } else if (session && needsOnboarding && !inOnboarding) {
      // Authenticated but needs onboarding and not already in onboarding
      console.log('[NavigationController] Needs onboarding, redirecting');
      // Use a short timeout to ensure the navigation happens after the render cycle
      setTimeout(() => router.replace('/onboarding'), 50);
    } else if (session && !needsOnboarding && inOnboarding) {
      // Completed onboarding but still on onboarding screen
      console.log('[NavigationController] Onboarding complete, redirecting to main');
      // Use a short timeout to ensure the navigation happens after the render cycle
      setTimeout(() => router.replace('/'), 50);
    }
  }, [session, segments, loading, needsOnboarding, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  // Just render the stack navigator - the navigation logic is handled by effects
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
        animation: 'slide_from_right',
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PatientAuthProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <NavigationController />
        </SafeAreaProvider>
      </PatientAuthProvider>
    </QueryClientProvider>
  );
}
