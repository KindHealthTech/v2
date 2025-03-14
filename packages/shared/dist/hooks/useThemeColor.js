"use strict";
/**
 * Hook to get the appropriate color based on the current theme
 * Used by both the doctors and patient apps
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThemeColor = useThemeColor;
const Colors_1 = require("../constants/Colors");
const useColorScheme_1 = require("./useColorScheme");
function useThemeColor(props, colorName) {
    const theme = (0, useColorScheme_1.useColorScheme)() ?? 'light';
    const colorFromProps = props[theme];
    if (colorFromProps) {
        return colorFromProps;
    }
    else {
        return Colors_1.Colors[theme][colorName];
    }
}
