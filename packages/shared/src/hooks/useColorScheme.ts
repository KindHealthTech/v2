import { useColorScheme as _useColorScheme, ColorSchemeName } from 'react-native';

// Exported from a central location so both apps can use the same hook
export function useColorScheme(): 'light' | 'dark' | null {
  const colorScheme = _useColorScheme();
  return colorScheme ?? null; // Handle undefined by returning null
}
