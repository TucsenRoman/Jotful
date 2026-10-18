import { BlurView } from 'expo-blur';
import { cssInterop } from 'nativewind';

// Third-party views don't take NativeWind `className` until they're registered.
// Without this, a className on BlurView is silently dropped (the header's glass
// pill lost its row layout on device).
cssInterop(BlurView, { className: 'style' });
