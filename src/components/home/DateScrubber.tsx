// Photos-style date scrubber in the left gutter (design/mocks/r6/scrubber.js, NOTES.md "Date scrubber").
// Hidden at rest; shows while the stack moves; grab the thumb to jump through time.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { JUMP, SPRING, clamp } from './stackMath';

const tokens = require('../../theme/tokens');
const c = tokens.color;
const ink: string = tokens.primitive.ink;

const TRACK_X = 17;
const HIT = 44;

type Props = {
  p: SharedValue<number>;
  maxIdx: SharedValue<number>;
  target: SharedValue<number>;
  visible: SharedValue<number>;
  grabbing: SharedValue<number>;
  stackFade: SharedValue<number>;
  top: number;
  height: number;
  months: number[]; // month key per card, time order
  labels: string[]; // bubble text per card ("Sep 21")
  notify: (n: number) => void; // worklet: rigid tap if the front card changed
  pulse: () => void; // worklet: show, then hide 600ms after motion stops
};

const selection = () => {
  void Haptics.selectionAsync();
};

export function DateScrubber({ p, maxIdx, target, visible, grabbing, stackFade, top, height, months, labels, notify, pulse }: Props) {
  const [on, setOn] = useState(false);
  const [bubble, setBubble] = useState(0);
  const grabY = useSharedValue(top);
  const startY = useSharedValue(top);
  const bubbleIdx = useSharedValue(0);
  const lastMonth = useSharedValue(-1);

  // Not tappable while hidden: flip pointerEvents only when visibility crosses the line.
  useAnimatedReaction(
    () => visible.value > 0.05,
    (now, prev) => {
      if (now !== prev) scheduleOnRN(setOn, now);
    },
  );

  const ticks = useMemo(() => {
    const max = months.length - 1;
    const out: number[] = [];
    months.forEach((m, i) => {
      if (i === 0 || m !== months[i - 1]) out.push(max > 0 ? (i / max) * height : 0);
    });
    return out;
  }, [months, height]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin(() => {
          const max = maxIdx.value;
          if (max < 1) return;
          cancelAnimation(p);
          const i = clamp(Math.round(p.value), 0, max);
          p.value = i;
          target.value = i;
          grabbing.value = 1;
          visible.value = withTiming(1, { duration: 120 });
          bubbleIdx.value = i;
          lastMonth.value = months[i] ?? -1;
          const y = top + (i / max) * height;
          startY.value = y;
          grabY.value = y;
          scheduleOnRN(setBubble, i);
        })
        .onUpdate((e) => {
          const max = maxIdx.value;
          if (max < 1) return;
          const y = clamp(startY.value + e.translationY, top, top + height);
          grabY.value = y;
          const i = clamp(Math.round(((y - top) / height) * max), 0, max);
          if (i === bubbleIdx.value) return;
          bubbleIdx.value = i;
          scheduleOnRN(setBubble, i);
          const m = months[i] ?? -1;
          if (m !== lastMonth.value) {
            lastMonth.value = m;
            scheduleOnRN(selection);
          }
          if (Math.abs(i - target.value) > JUMP) {
            // Far jump: no per-card fall, just a quick settle.
            cancelAnimation(p);
            p.value = i;
            stackFade.value = 0.55;
            stackFade.value = withTiming(1, { duration: 120 });
          } else {
            p.value = withSpring(i, SPRING);
          }
          target.value = i;
        })
        .onFinalize(() => {
          if (grabbing.value === 0) return;
          grabbing.value = 0;
          const i = bubbleIdx.value;
          if (Math.abs(p.value - i) > 1e-3) p.value = withSpring(i, SPRING);
          notify(i);
          pulse();
        }),
    [p, maxIdx, target, visible, grabbing, stackFade, top, height, months, notify, pulse, grabY, startY, bubbleIdx, lastMonth],
  );

  const wrap = useAnimatedStyle(() => ({ opacity: visible.value }));
  const thumbY = useAnimatedStyle(() => {
    const max = maxIdx.value;
    const y = grabbing.value ? grabY.value : top + (max > 0 ? clamp(p.value, 0, max) / max : 0) * height;
    return { transform: [{ translateY: y - HIT / 2 }] };
  });
  const thumbPill = useAnimatedStyle(() => ({
    width: withTiming(grabbing.value ? 7 : 6, { duration: 150 }),
    transform: [{ scaleY: withTiming(grabbing.value ? 1.06 : 1, { duration: 150 }) }],
  }));
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: withTiming(grabbing.value ? 1 : 0, { duration: 120 }),
    transform: [
      { translateY: grabY.value - 17 },
      { translateX: withTiming(grabbing.value ? 0 : -6, { duration: 120 }) },
      { scale: withTiming(grabbing.value ? 1 : 0.96, { duration: 120 }) },
    ],
  }));

  return (
    <Animated.View pointerEvents={on ? 'box-none' : 'none'} style={[StyleSheet.absoluteFill, wrap]}>
      <View pointerEvents="none" style={[styles.track, { top, height }]}>
        {ticks.map((y, i) => (
          <View key={i} style={[styles.tick, { top: y - 1 }]} />
        ))}
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[styles.hit, thumbY]}
          accessibilityRole="adjustable"
          accessibilityLabel="Date scrubber"
        >
          <Animated.View style={[styles.thumb, thumbPill]} />
        </Animated.View>
      </GestureDetector>
      <Animated.View pointerEvents="none" style={[styles.bubble, bubbleStyle]}>
        <Text style={styles.bubbleText}>{labels[bubble] ?? ''}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: { position: 'absolute', left: TRACK_X, width: 2, borderRadius: 1, backgroundColor: c.fill },
  tick: { position: 'absolute', left: -2, width: 6, height: 2, borderRadius: 1, backgroundColor: ink, opacity: 0.18 },
  hit: {
    position: 'absolute',
    top: 0,
    left: TRACK_X + 1 - HIT / 2,
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    height: 36,
    borderRadius: 3.5,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.separator,
    shadowColor: ink,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  bubble: {
    position: 'absolute',
    top: 0,
    left: 44,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: c.surface,
    shadowColor: ink,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bubbleText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2, color: c.ink },
});
