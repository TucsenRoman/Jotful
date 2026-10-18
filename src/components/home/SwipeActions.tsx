// The small circle revealed beside the front card while it slides (design/mocks/r3/swipe/cards.js actState).
// Right drag = Resolve (graphite, white check) on the left; left drag = Pin (white, black pin) on the right;
// past 122pt left = grey "Coming soon".
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Check, Ellipsis, Pin } from 'lucide-react-native';
import { CARD_H } from './stackMath';

const tokens = require('../../theme/tokens');
const c = tokens.color;
const p = tokens.primitive;
const M = tokens.motion;
const SIZE: number = tokens.size.swipeCircle; // 52
const BOX = 100; // wide enough for the "Coming soon" caption

type Kind = 'resolve' | 'pin' | 'later';

function ActionCircle({ kind, x, pop, cardW }: { kind: Kind; x: SharedValue<number>; pop: SharedValue<number>; cardW: number }) {
  const style = useAnimatedStyle(() => {
    const v = x.value;
    const current: Kind = v > 0 ? 'resolve' : v <= -M.swipeLong ? 'later' : 'pin';
    const gap = Math.abs(v);
    if (current !== kind || gap < 0.5) return { opacity: 0, transform: [{ translateX: 0 }] };
    const half = kind === 'later' ? 40 : SIZE / 2;
    const cx = Math.max(half, gap - 12 - half);
    const center = v > 0 ? cx : cardW - cx;
    return { opacity: Math.min(1, gap / 40), transform: [{ translateX: center - BOX / 2 }] };
  });
  const circle = useAnimatedStyle(() => {
    const gap = Math.abs(x.value);
    return { transform: [{ scale: (0.6 + 0.4 * Math.min(1, gap / M.swipeDetent)) * pop.value }] };
  });
  const look =
    kind === 'resolve'
      ? { backgroundColor: c.resolveBack }
      : kind === 'pin'
        ? [{ backgroundColor: c.pinBack }, styles.pinShadow]
        : { backgroundColor: p.grey3 };
  return (
    <Animated.View pointerEvents="none" style={[styles.box, style]}>
      <Animated.View style={[styles.circle, look, circle]}>
        {kind === 'resolve' && <Check size={24} color={c.onInk} strokeWidth={2.4} />}
        {kind === 'pin' && <Pin size={24} color={c.ink} strokeWidth={2.4} style={{ transform: [{ rotate: '-45deg' }] }} />}
        {kind === 'later' && <Ellipsis size={24} color={p.grey} strokeWidth={2.4} />}
      </Animated.View>
      <Text style={[styles.caption, kind === 'later' && { color: p.grey }]}>
        {kind === 'resolve' ? 'Resolve' : kind === 'pin' ? 'Pin' : 'Coming soon'}
      </Text>
    </Animated.View>
  );
}

export function SwipeActions({ x, pop, cardW }: { x: SharedValue<number>; pop: SharedValue<number>; cardW: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ActionCircle kind="resolve" x={x} pop={pop} cardW={cardW} />
      <ActionCircle kind="pin" x={x} pop={pop} cardW={cardW} />
      <ActionCircle kind="later" x={x} pop={pop} cardW={cardW} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, top: CARD_H / 2 - SIZE / 2, width: BOX, alignItems: 'center' },
  circle: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  pinShadow: {
    shadowColor: p.ink,
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  caption: { marginTop: 6, fontSize: 13, lineHeight: 18, fontWeight: '600', color: c.secondary },
});
