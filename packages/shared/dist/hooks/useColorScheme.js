"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useColorScheme = useColorScheme;
const react_native_1 = require("react-native");
// Exported from a central location so both apps can use the same hook
function useColorScheme() {
    const colorScheme = (0, react_native_1.useColorScheme)();
    return colorScheme ?? null; // Handle undefined by returning null
}
