/**
 * Hook to get the appropriate color based on the current theme
 * Used by both the doctors and patient apps
 */
import { Colors } from '../constants/Colors';
export declare function useThemeColor(props: {
    light?: string;
    dark?: string;
}, colorName: keyof typeof Colors.light & keyof typeof Colors.dark): string;
