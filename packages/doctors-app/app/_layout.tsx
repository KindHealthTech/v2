import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import { DoctorAuthProvider, useDoctorAuth } from '@/context/doctor-auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/client';
import { useAppColorScheme, useDeviceContext } from 'twrnc';
import tw from '@/lib/tailwind';
import { ThemeProvider } from '@/context/theme';
import { useTheme } from '@/context/theme';
import '../lib/global.css'
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Inner component that handles navigation based on auth state
function NavigationController() {
  const { session, loading, needsOnboarding, user } = useDoctorAuth();
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
    
    console.log('[NavigationController] Determining navigation:', {
      inAuthGroup,
      inOnboarding,
      hasSession: !!session,
      needsOnboarding
    });
    
    if (!session && !inAuthGroup) {
      // Not authenticated, redirect to sign in
      console.log('[NavigationController] Redirecting to sign-in');
      router.replace('/auth/sign-in');
    } else if (session && inAuthGroup) {
      // Authenticated but in auth group, redirect appropriately
      const destination = needsOnboarding ? '/onboarding' : '/';
      console.log(`[NavigationController] Authenticated in auth group, redirecting to ${destination}`);
      router.replace(destination);
    } else if (session && needsOnboarding && !inOnboarding) {
      // Authenticated but needs onboarding and not already in onboarding
      console.log('[NavigationController] Needs onboarding, redirecting');
      router.replace('/onboarding');
    } else if (session && !needsOnboarding && inOnboarding) {
      // Completed onboarding but still on onboarding screen
      console.log('[NavigationController] Onboarding complete, redirecting to main');
      router.replace('/');
    }
  }, [session, segments, loading, needsOnboarding, router]);

  // Just render the stack navigator - the navigation logic is handled by effects
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="auth/sign-in" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

// Root layout component that sets up providers
function RootLayoutNav() {
  const theme = useTheme();
  const [colorScheme, toggleColorScheme, setColorScheme] = useAppColorScheme(tw);
  useDeviceContext(tw, {
    observeDeviceColorSchemeChanges: false,
    initialColorScheme: 'device'
  });

  return (
    <QueryClientProvider client={queryClient}>
    <DoctorAuthProvider>
    <ThemeProvider>
      <NavigationController />
      <StatusBar style="auto" />
    </ThemeProvider>
    </DoctorAuthProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <RootLayoutNav />
  );
}
