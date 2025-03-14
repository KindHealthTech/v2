import { Stack } from 'expo-router';

export default function SettingsLayout() {
  console.log('Working')
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#0284c7',
        headerTitleStyle: {
          fontWeight: '600',
        },
        
      }}
    />
  );
}
