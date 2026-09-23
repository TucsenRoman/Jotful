import { ChevronDown, Mic, Square } from 'lucide-react-native';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const collapsedHeight = 84;
const expandedBaseHeight = 292;
const colors = { cream: '#F5F0E6', roast: '#242019', moss: '#74876A' };

export type CaptureSheetHandle = {
  open: (mode?: 'write' | 'voice') => void;
  close: () => void;
};

type Props = {
  prompt: string;
  draft: string;
  previewCount: number;
  listening: boolean;
  onDraftChange: (text: string) => void;
  onToggleVoice: () => void;
  onStopVoice: () => void;
  onSave: () => void;
  onClear: () => void;
  onCollapseHaptic: () => void;
};

const CaptureSheet = forwardRef<CaptureSheetHandle, Props>(function CaptureSheet({ prompt, draft, previewCount, listening, onDraftChange, onToggleVoice, onStopVoice, onSave, onClear, onCollapseHaptic }, ref) {
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);
  const pendingCollapse = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // 0 is open and 1 is collapsed. The sheet never unmounts or changes its view tree.
  const progress = useSharedValue(0);
  const sheetHeight = Math.min(viewportHeight - insets.top - 12, expandedBaseHeight + keyboardHeight + insets.bottom);
  const collapsedOffset = sheetHeight - (collapsedHeight + insets.bottom);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: progress.value * collapsedOffset }] }), [collapsedOffset]);
  const collapsedStyle = useAnimatedStyle(() => ({ opacity: progress.value }), []);
  const expandedStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }), []);

  const animate = (to: 0 | 1, onDone?: () => void) => {
    progress.value = withTiming(to, { duration: 260, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished && onDone) runOnJS(onDone)();
    });
  };

  const focusInput = () => inputRef.current?.focus();
  const beginVoice = () => onToggleVoice();

  const collapseAfterKeyboard = () => {
    pendingCollapse.current = false;
    animate(1);
  };

  const open = (mode: 'write' | 'voice' = 'write') => {
    animate(0, mode === 'voice' ? beginVoice : focusInput);
  };

  const close = () => {
    if (listening) onStopVoice();
    onCollapseHaptic();
    pendingCollapse.current = keyboardHeight > 0;
    inputRef.current?.blur();
    if (pendingCollapse.current) Keyboard.dismiss();
    else animate(1);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => setKeyboardHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      if (pendingCollapse.current) requestAnimationFrame(collapseAfterKeyboard);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  useImperativeHandle(ref, () => ({
    open,
    close
  }), [keyboardHeight, listening, onCollapseHaptic, onStopVoice]);

  return <Animated.View className="bg-unsorted-cream px-5 pt-3 shadow-xl" style={[{ position: 'absolute', bottom: -insets.bottom, left: 0, right: 0, height: sheetHeight, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: insets.bottom + 18 }, sheetStyle]}>
    <Animated.View style={[{ position: 'absolute', top: 12, left: 20, right: 20 }, collapsedStyle]}>
      <View className="flex-row items-center gap-2">
        <Pressable onPress={() => open()} className="h-14 flex-1 justify-center rounded-full border border-unsorted-line bg-unsorted-canvas px-4" accessibilityLabel="Open thought capture">
          <Text numberOfLines={1} className="text-[16px] leading-6 text-unsorted-moss" style={{ fontFamily: 'DMSans_400Regular' }}>{prompt}</Text>
        </Pressable>
        <Pressable onPress={() => open('voice')} className="h-10 w-10 items-center justify-center rounded-full bg-unsorted-persimmon" hitSlop={10} accessibilityLabel="Speak a thought"><Mic size={18} color={colors.roast} /></Pressable>
      </View>
    </Animated.View>
    <Animated.View style={expandedStyle} pointerEvents="auto">
      <View className="absolute left-0 right-0 items-center" style={{ top: -60 }}>
        <Pressable onPress={close} className="h-9 w-16 items-center justify-center rounded-full shadow-xl" style={{ backgroundColor: 'rgba(36, 32, 25, 0.6)' }} hitSlop={12} accessibilityLabel="Collapse thought capture"><ChevronDown size={22} color={colors.cream} /></Pressable>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="h-14 flex-1 justify-center rounded-full border border-unsorted-line bg-unsorted-canvas px-4">
          <TextInput ref={inputRef} value={draft} onChangeText={onDraftChange} placeholder={prompt} placeholderTextColor={colors.moss} multiline scrollEnabled className="h-full w-full py-0 text-[16px] leading-6 text-unsorted-ink" style={{ fontFamily: 'DMSans_400Regular' }} textAlignVertical="center" />
        </View>
        <Pressable onPress={onToggleVoice} className={'h-10 w-10 items-center justify-center rounded-full ' + (listening ? 'bg-[#F8D8D1]' : 'bg-unsorted-persimmon')} hitSlop={10} accessibilityLabel={listening ? 'Stop voice input' : 'Speak a thought'}>{listening ? <Square size={13} fill={colors.roast} color={colors.roast} /> : <Mic size={18} color={colors.roast} />}</Pressable>
      </View>
      <View className="mt-4 items-center"><Pressable onPress={onSave} disabled={previewCount === 0 || listening} className={'items-center rounded-full px-6 py-3 ' + (listening ? 'bg-[#F8D8D1]' : previewCount ? 'bg-unsorted-persimmon' : 'bg-[#E4DCCE]')} style={{ opacity: listening || previewCount ? 1 : 0.52 }}>{listening ? <Text className="text-[14px] text-unsorted-roast" style={{ fontFamily: 'DMSans_700Bold' }}>Listening</Text> : <Text className={'text-[14px] ' + (previewCount ? 'text-unsorted-roast' : 'text-[#8F8478]')} style={{ fontFamily: 'DMSans_700Bold' }}>{previewCount === 1 ? 'Save thought' : 'Save thoughts'}</Text>}</Pressable>{draft.trim().length > 0 && !listening && <Pressable onPress={onClear} className="mt-2 border-b border-[#BDB4A9] pb-0.5" hitSlop={10} accessibilityLabel="Clear thought"><Text className="text-[13px] text-[#9B9187]" style={{ fontFamily: 'DMSans_500Medium' }}>Clear thought</Text></Pressable>}</View>
    </Animated.View>
  </Animated.View>;
});

export default CaptureSheet;
