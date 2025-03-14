import { Redirect } from 'expo-router';

// This file redirects from the root route (/) to the tabbed navigation
export default function HomeRedirect() {
  return <Redirect href="/(tabs)" />;
}
