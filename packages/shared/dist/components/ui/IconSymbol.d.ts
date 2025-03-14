import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';
declare const MAPPING: Partial<Record<import("expo-symbols").SymbolViewProps["name"], React.ComponentProps<typeof MaterialIcons>["name"]>>;
export type IconSymbolName = keyof typeof MAPPING;
/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export declare function IconSymbol({ name, size, color, style, weight, }: {
    name: IconSymbolName;
    size?: number;
    color: string | OpaqueColorValue;
    style?: StyleProp<ViewStyle>;
    weight?: SymbolWeight;
}): React.JSX.Element;
export {};
