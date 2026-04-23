/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Material Design 3 Color Palette for Vault App
export const MaterialColors = {
  light: {
    primary: '#006a5e',
    onPrimary: '#ffffff',
    primaryContainer: '#1d8577',
    onPrimaryContainer: '#000605',
    secondary: '#44655e',
    onSecondary: '#ffffff',
    secondaryContainer: '#c6eae1',
    onSecondaryContainer: '#4a6b64',
    tertiary: '#8f4832',
    onTertiary: '#ffffff',
    tertiaryContainer: '#ad5f48',
    onTertiaryContainer: '#fffbff',
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
    background: '#f6faf8',
    onBackground: '#181d1b',
    surface: '#f6faf8',
    onSurface: '#181d1b',
    surfaceVariant: '#dfe3e1',
    onSurfaceVariant: '#3e4946',
    outline: '#6e7a76',
    outlineVariant: '#bdc9c5',
    inverseSurface: '#2d3130',
    inverseOnSurface: '#eef2ef',
    inversePrimary: '#7ad7c6',
    surfaceBright: '#f6faf8',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f0f4f2',
    surfaceContainer: '#ebefec',
    surfaceContainerHigh: '#e5e9e7',
    surfaceContainerHighest: '#dfe3e1',
    surfaceDim: '#d7dbd9',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
