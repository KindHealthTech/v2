"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemedView = ThemedView;
const react_native_1 = require("react-native");
const useThemeColor_1 = require("../hooks/useThemeColor");
function ThemedView({ style, lightColor, darkColor, ...otherProps }) {
    const backgroundColor = (0, useThemeColor_1.useThemeColor)({ light: lightColor, dark: darkColor }, 'background');
    return <react_native_1.View style={[{ backgroundColor }, style]} {...otherProps}/>;
}
