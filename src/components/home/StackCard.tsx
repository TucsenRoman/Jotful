// One slot in the Rolodex: its pose comes from p on the UI thread (stackMath.poseFor).
// Slots are pooled (ThoughtStack keys them by slot, not by thought), so a card never remounts
// mid-animation; draw order is a fixed zIndex per time index (newer above older).
// The front card also takes the horizontal swipe (right = resolve, left = pin).
import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Thought } from '../../storage';
import { ThoughtCard, cardBackground } from './ThoughtCard';
import { SwipeActions } from './SwipeActions';
import { CARD_H, CARD_LEFT, SPRING, clamp, poseFor, type StackDebug } from './stackMath';

const tokens = require('../../theme/tokens');
const M = tokens.motion;
const FADE: number = M.fade; // 180

export type SwipeAction = 'resolve' | 'pin' | 'later';

type Props = {
  index: number;
  zIndex: number;
  thought: Thought;
  isFront: boolean;
  interactive: boolean;
  more: string;
  cardW: number;
  cardTop: number;
  fan: number;
  debug: StackDebug;
  p: SharedValue<number>;
  flying: SharedValue<number>;
  maxIdx: SharedValue<number>;
  solo: SharedValue<number>;
  swipeX: SharedValue<number>;
  pop: SharedValue<number>;
  onPressCard: (index: number) => void;
  onAction: (action: 'askAI' | 'searchWeb' | 'copy', id: number) => void;
  onSwipeDetent: (level: number) => void;
  onSwipeCommit: (action: SwipeAction, id: number) => void;
};

function StackCardBase(props: Props) {
  const { index, zIndex, thought, isFront, interactive, more, cardW, cardTop, fan, debug, p, flying, maxIdx, solo, swipeX, pop } = props;
  const { onPressCard, onAction, onSwipeDetent, onSwipeCommit } = props;
  const id = thought.id;

  const outer = useAnimatedStyle(() => {
    const s = poseFor(index, p.value, fan, maxIdx.value, flying.value);
    // Hidden cards return a constant style so they cost nothing per frame.
    if (s.opacity <= 0) return { opacity: 0, transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }] };
    const front = clamp(Math.round(p.value), 0, maxIdx.value) === index;
    const others = front ? 0 : solo.value;
    const shrink = 1 - 0.03 * others;
    // 2D only (see poseFor): real 3D layers flickered through each other on iOS.
    return {
      opacity: s.opacity * (1 - others),
      transform: [{ translateY: s.y }, { scaleX: s.scaleX * shrink }, { scaleY: s.scaleY * shrink }],
    };
  });

  const dim = useAnimatedStyle(() => ({ opacity: poseFor(index, p.value, fan, maxIdx.value).dim }));

  // Only the front card casts a shadow, and it doesn't animate: iOS redrew every card's
  // changing shadow each frame (no shadow path), which made the stack choppy.
  const face = useAnimatedStyle(() => ({
    transform: [{ translateX: isFront ? swipeX.value : 0 }],
  }));
  const moreStyle = useAnimatedStyle(() => ({
    opacity: clamp(1 - 2 * Math.abs(index - p.value), 0, 1),
  }));

  const det = useSharedValue(0);
  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isFront)
        .activeOffsetX([-12, 12])
        .failOffsetY([-10, 10])
        .onStart(() => {
          det.value = 0;
          solo.value = withTiming(1, { duration: FADE });
        })
        .onUpdate((e) => {
          const x = clamp(e.translationX, -M.swipeClamp, M.swipeClamp);
          swipeX.value = x;
          const nd = x <= -M.swipeLong ? 2 : Math.abs(x) >= M.swipeDetent ? 1 : 0;
          if (nd !== det.value) {
            if (nd > det.value) scheduleOnRN(onSwipeDetent, nd);
            det.value = nd;
          }
        })
        .onEnd(() => {
          const x = swipeX.value;
          const action: SwipeAction | null =
            x >= M.swipeDetent ? 'resolve' : x <= -M.swipeLong ? 'later' : x <= -M.swipeDetent ? 'pin' : null;
          if (!action) {
            swipeX.value = withSpring(0, SPRING);
            solo.value = withTiming(0, { duration: FADE });
            return;
          }
          const off = action === 'resolve' ? 110 : action === 'later' ? -130 : -110;
          swipeX.value = withTiming(off, { duration: FADE }, (done) => {
            if (!done) return;
            pop.value = withSequence(withTiming(1.12, { duration: 90 }), withTiming(1, { duration: 150 }));
            scheduleOnRN(onSwipeCommit, action, id);
            swipeX.value = withDelay(120, withSpring(0, SPRING));
            solo.value = withDelay(420, withTiming(0, { duration: FADE }));
          });
        }),
    [isFront, id, onSwipeDetent, onSwipeCommit, solo, swipeX, pop, det],
  );

  return (
    <Animated.View
      pointerEvents={interactive ? 'box-none' : 'none'}
      style={[styles.slot, { top: cardTop, width: cardW, zIndex }, outer]}
    >
      {isFront && <SwipeActions x={swipeX} pop={pop} cardW={cardW} />}
      <GestureDetector gesture={swipe}>
        <Animated.View style={[styles.card, { backgroundColor: cardBackground(thought) }, isFront && !debug.noShadow ? styles.shadow : null, face]}>
          <ThoughtCard
            plain={debug.plain}
            thought={thought}
            isFront={isFront}
            more={more}
            moreStyle={moreStyle}
            onPress={() => onPressCard(index)}
            onAskAI={() => onAction('askAI', id)}
            onSearchWeb={() => onAction('searchWeb', id)}
            onCopy={() => onAction('copy', id)}
          />
          <Animated.View pointerEvents="none" style={[styles.dim, dim]} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export const StackCard = memo(StackCardBase);

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: CARD_LEFT,
    height: CARD_H,
    transformOrigin: 'top',
  },
  card: { flex: 1, borderRadius: tokens.radius.homeCard },
  shadow: { shadowColor: tokens.primitive.ink, shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: tokens.radius.homeCard,
    backgroundColor: tokens.primitive.ink,
  },
});
