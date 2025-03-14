declare module '@kht/shared' {
  // Explicitly declare the types for components
  import { TextProps, ViewProps } from 'react-native';
  
  // Component types
  export interface ThemedTextProps extends TextProps {
    lightColor?: string;
    darkColor?: string;
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  }
  
  export interface ThemedViewProps extends ViewProps {
    lightColor?: string;
    darkColor?: string;
  }
  
  // Re-exported components
  export function ThemedText(props: ThemedTextProps): JSX.Element;
  export function ThemedView(props: ThemedViewProps): JSX.Element;
  
  // Re-exported hooks
  export function useColorScheme(): 'light' | 'dark' | null;
  export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: string
  ): string;
  
  // Re-exported constants
  export const Colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}
