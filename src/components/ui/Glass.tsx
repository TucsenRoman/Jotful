import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// iOS 26 Liquid Glass (expo-glass-effect) for controls, sheets and the scrubber, as Apple's
// HIG puts glass on the functional layer only. Falls back to a frosted blur on older iOS, and
// on a dev build made before expo-glass-effect was added (the native module is missing there).
let GlassView: React.ComponentType<any> | null = null;
let liquid = false;
try {
  const glass = require('expo-glass-effect');
  liquid = glass.isLiquidGlassAvailable();
  GlassView = glass.GlassView;
} catch {
  liquid = false;
}

type Props = {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  // 'regular' for text-heavy surfaces (sheets, menus), 'clear' over photos.
  variant?: 'regular' | 'clear';
  interactive?: boolean;
  // Fallback fill under the blur when Liquid Glass isn't there.
  fallbackFill?: string;
};

export function Glass({ style, children, variant = 'regular', interactive = false, fallbackFill = 'rgba(255,255,255,0.78)' }: Props) {
  if (liquid && GlassView) {
    return <GlassView glassEffectStyle={variant} isInteractive={interactive} colorScheme="light" style={[{ overflow: 'hidden' }, style]}>{children}</GlassView>;
  }
  return <View style={[{ overflow: 'hidden', backgroundColor: fallbackFill }, style]}>
    <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
    {children}
  </View>;
}

export const hasLiquidGlass = liquid;
