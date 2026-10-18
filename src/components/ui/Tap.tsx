import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

// A Pressable that accepts a style *function* safely. NativeWind wraps
// Pressable and can drop a function style on device (Settings rows lost their
// padding), so this resolves the function itself and hands Pressable a plain style.
type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
};

export function Tap({ style, onPressIn, onPressOut, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);
  return <Pressable
    {...rest}
    onPressIn={(e) => { setPressed(true); onPressIn?.(e); }}
    onPressOut={(e) => { setPressed(false); onPressOut?.(e); }}
    style={typeof style === 'function' ? style({ pressed }) : style}
  />;
}
