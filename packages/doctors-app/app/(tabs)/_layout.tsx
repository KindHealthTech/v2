import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import tw from '@/lib/tailwind';

export default function TabLayout() {
  const router = useRouter();

  const ProfileButton = () => (
    <TouchableOpacity
      style={tw`mr-4`}
      onPress={() => router.push('/profile')}
    >
      <View style={tw`w-8 h-8 rounded-full bg-sky-100 items-center justify-center`}>
        <Ionicons name="person" size={16} color="#0284c7" />
      </View>
    </TouchableOpacity>
  );

  const BackButton = () => (
    <TouchableOpacity
      style={tw`ml-4`}
      onPress={() => router.push('/')}
    >
      <Ionicons name="chevron-back" size={24} color="#0284c7" />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        headerRight: () => <ProfileButton />,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'KHT',
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        
        options={{
          title: 'Profile',
          headerShown: true,
          headerLeft: () => <BackButton />
        }}
      />
    </Tabs>
  );
}
