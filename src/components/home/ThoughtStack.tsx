// Home Rolodex stack (design/mocks/r6/home.html + NOTES.md, r3/swipe).
// One shared value, p = cards fallen so far, drives every card on the UI thread.
// Drag down flips the front card forward; drag up brings the previous one back. No loop.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { getPreference, type Thought } from '../../storage';
import { StackCard, type SwipeAction } from './StackCard';
import { DateScrubber } from './DateScrubber';
import { EmptyStack } from './EmptyStack';
import { moreLabel, monthKey, shortDate } from './format';
import {
  CARD_H,
  CARD_LEFT,
  CARD_RIGHT,
  D,
  FAN_H,
  FLICK,
  SHEET_GAP,
  SHOW,
  SPRING,
  clamp,
  rubber,
  stackY,
  unrubber,
} from './stackMath';

const tokens = require('../../theme/tokens');
const COUNT_FADE_IN = 200;
const COUNT_HOLD: number = tokens.motion.countFadeOut; // 600
const COUNT_LINE = 15;
// iOS sorts 3D layers by depth: with zIndex 1 apart the tilting card sliced through the cards
// behind it (the flicker; flat flip stopped it). Spacing them wider than a card is tall keeps
// the tilt and makes the cut-through impossible.
const Z_GAP = 600;
// Mounted card slots. Wide enough that a hard fling runs into cards that are already
// mounted and drawn (with 10, cards ahead popped in late and the fling looked choppy).
// Seconds a release coasts at its speed when projecting where it lands (iOS feel, a bit longer).
const GLIDE = 0.8;
const POOL = 18;
const AHEAD = 12; // slots from the front card back; the other 6 hold cards that already fell (a drag up brings them back)
// iOS scroll-view deceleration (0.998 per ms): a hard flick coasts through several cards.
// the same feel as an iOS scroll view decelerating at 0.997/ms.

const selection = () => {
  void Haptics.selectionAsync();
};

export type ThoughtStackProps = {
  thoughts: Thought[]; // filtered, newest first; index 0 = front card
  bottomInset: number; // capture sheet peek height
  onOpen(t: Thought): void;
  onResolve(t: Thought): void;
  onPin(t: Thought): void;
  onAskAI(t: Thought): void;
  onSearchWeb(t: Thought): void;
  onCopy(t: Thought): void;
  onReservedSwipe?(t: Thought): void;
  /** Change this (e.g. on a filter change) to jump back to the newest card. */
  resetKey?: string | number;
};

const rigid = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
};

export function ThoughtStack(props: ThoughtStackProps) {
  const { thoughts, bottomInset, resetKey } = props;
  const N = thoughts.length;
  const debug = useMemo(() => ({ flat: getPreference('debug.flat', '0') === '1', noShadow: getPreference('debug.noShadow', '0') === '1', plain: getPreference('debug.plain', '0') === '1' }), []);

  const propsRef = useRef(props);
  propsRef.current = props;

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [frontIndex, setFrontIndex] = useState(0);
  const frontRef = useRef(0);
  frontRef.current = frontIndex;

  const p = useSharedValue(0); // cards fallen
  const p0 = useSharedValue(0);
  const maxIdx = useSharedValue(Math.max(0, N - 1));
  const target = useSharedValue(0);
  const notified = useSharedValue(0);
  const visible = useSharedValue(0); // count + scrubber
  const dragging = useSharedValue(0);
  const grabbing = useSharedValue(0);
  const stackFade = useSharedValue(1);
  const solo = useSharedValue(0); // others fade while the front card slides
  const swipeX = useSharedValue(0);
  const pop = useSharedValue(1);
  const flying = useSharedValue(0); // a hard flick is decaying through several cards

  // Warm the image cache for remote photos (the sample thoughts) so a fast fling
  // doesn't show cards whose photo is still downloading. Local photos load from disk.
  useEffect(() => {
    thoughts.forEach((t) => {
      if (t.attachmentKind === 'image' && t.attachmentUri?.startsWith('http')) void Image.prefetch(t.attachmentUri).catch(() => {});
    });
  }, [thoughts]);

  // ---- keep p on the same thought when the list changes ----
  const idsKey = useMemo(() => thoughts.map((t) => t.id).join(','), [thoughts]);
  const prevIds = useRef<number[] | null>(null);
  useEffect(() => {
    const ids = thoughts.map((t) => t.id);
    const max = Math.max(0, ids.length - 1);
    maxIdx.value = max;
    const prev = prevIds.current;
    prevIds.current = ids;
    let next = 0;
    if (prev && prev.length && ids.length) {
      const newAtHead = !prev.includes(ids[0]);
      const at = ids.indexOf(prev[clamp(frontRef.current, 0, prev.length - 1)]);
      next = newAtHead ? 0 : at >= 0 ? at : clamp(frontRef.current, 0, max);
    }
    if (next !== frontRef.current || Math.abs(p.value - next) > 1e-3) {
      cancelAnimation(p);
      p.value = next;
    }
    target.value = next;
    notified.value = next;
    setFrontIndex(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    if (resetKey === undefined) return;
    cancelAnimation(p);
    p.value = 0;
    target.value = 0;
    notified.value = 0;
    setFrontIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // ---- worklets shared by the stack pan and the scrubber ----
  const notify = useCallback(
    (n: number) => {
      'worklet';
      const m = clamp(n, 0, maxIdx.value);
      if (m !== notified.value) {
        notified.value = m;
        scheduleOnRN(rigid);
      }
    },
    [maxIdx, notified],
  );

  const pulse = useCallback(() => {
    'worklet';
    if (dragging.value || grabbing.value) {
      visible.value = withTiming(1, { duration: COUNT_FADE_IN });
    } else {
      visible.value = withSequence(
        withTiming(1, { duration: COUNT_FADE_IN }),
        withDelay(COUNT_HOLD, withTiming(0, { duration: 250 })),
      );
    }
  }, [dragging, grabbing, visible]);

  // Front card index for React (buttons, count text, render window). Re-rendering every card
  // mid-motion made them flicker on device, so React only hears about it once the stack has
  // settled, or when motion runs far enough that the 10-slot window would run out.
  const jsFront = useSharedValue(0);
  useEffect(() => {
    jsFront.value = frontIndex;
  }, [frontIndex, jsFront]);
  useAnimatedReaction(
    () => clamp(Math.round(p.value), 0, maxIdx.value),
    (i, prev) => {
      if (i === prev || prev === null) return;
      if (flying.value) scheduleOnRN(selection); // a light tick per card while flying
    },
  );
  useAnimatedReaction(
    () => {
      const i = clamp(Math.round(p.value), 0, maxIdx.value);
      const settled = !dragging.value && !flying.value && Math.abs(p.value - target.value) < 0.01;
      return settled || Math.abs(i - jsFront.value) >= 4 ? i : -1; // 4 < the 6 behind, so a card coming back is always mounted
    },
    (i) => {
      if (i >= 0 && i !== jsFront.value) {
        jsFront.value = i;
        scheduleOnRN(setFrontIndex, i);
      }
    },
  );

  // Count text and scrubber show whenever the stack moves.
  useAnimatedReaction(
    () => p.value,
    (v, prev) => {
      if (prev !== null && v !== prev) pulse();
    },
  );

  // ---- vertical drag: the Rolodex ----
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .failOffsetX([-12, 12])
        .onStart(() => {
          flying.value = 0;
          cancelAnimation(p);
          p0.value = unrubber(p.value, maxIdx.value);
          dragging.value = 1;
          pulse();
        })
        .onUpdate((e) => {
          const max = maxIdx.value;
          p.value = rubber(p0.value + e.translationY / D, max);
          if (p.value < 0 || p.value > max) return; // rubber band: no haptic
          if (Math.floor(p.value) > notified.value) notify(Math.floor(p.value));
          else if (Math.ceil(p.value) < notified.value) notify(Math.ceil(p.value));
        })
        .onEnd((e) => {
          // One continuous glide: project where the flick would coast (like an iOS scroll
          // view), land on the nearest card there, and spring straight to it. The old
          // coast-then-snap had a seam in the middle that felt choppy.
          const max = maxIdx.value;
          const v = e.velocityY / D; // cards per second
          let tg: number;
          if (p.value > max) tg = max;
          else if (p.value < 0) tg = 0;
          else {
            const projected = p.value + v * GLIDE;
            tg = Math.round(projected);
            // A small flick always moves one card in its direction.
            if (Math.abs(e.velocityY) / 1000 > FLICK) {
              if (v > 0 && tg <= Math.floor(p.value)) tg = Math.floor(p.value) + 1;
              if (v < 0 && tg >= Math.ceil(p.value)) tg = Math.ceil(p.value) - 1;
            }
          }
          tg = clamp(tg, 0, max);
          const dist = Math.abs(tg - p.value);
          flying.value = dist >= 1.5 ? 1 : 0; // ticks per card on long glides
          notified.value = flying.value ? clamp(Math.round(p.value), 0, max) : notified.value;
          target.value = tg;
          if (!flying.value) notify(tg);
          p.value = withSpring(
            tg,
            { duration: Math.min(1600, 380 + 110 * dist), dampingRatio: 1, velocity: v, overshootClamping: true },
            (finished) => {
              if (!flying.value) return;
              flying.value = 0;
              if (finished) notify(tg);
            },
          );
        })
        .onFinalize(() => {
          dragging.value = 0;
          pulse();
        }),
    [p, p0, maxIdx, notified, dragging, target, flying, notify, pulse],
  );

  // ---- JS callbacks (stable, read the latest props through a ref) ----
  const byId = useCallback((id: number) => propsRef.current.thoughts.find((t) => t.id === id), []);

  const onPressCard = useCallback(
    (index: number) => {
      const t = propsRef.current.thoughts[index];
      if (!t) return;
      if (index === frontRef.current) {
        propsRef.current.onOpen(t);
        return;
      }
      // Tap a card in the fan: spin to it.
      flying.value = 0;
      cancelAnimation(p);
      target.value = index;
      p.value = withSpring(index, SPRING);
      if (notified.value !== index) {
        notified.value = index;
        rigid();
      }
    },
    [p, target, notified, flying],
  );

  const onAction = useCallback(
    (action: 'askAI' | 'searchWeb' | 'copy', id: number) => {
      const t = byId(id);
      if (!t) return;
      const pr = propsRef.current;
      if (action === 'askAI') pr.onAskAI(t);
      else if (action === 'searchWeb') pr.onSearchWeb(t);
      else pr.onCopy(t);
    },
    [byId],
  );

  const onSwipeDetent = useCallback((level: number) => {
    void Haptics.impactAsync(level >= 2 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const onSwipeCommit = useCallback(
    (action: SwipeAction, id: number) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        const t = byId(id);
        if (!t) return;
        const pr = propsRef.current;
        if (action === 'resolve') pr.onResolve(t);
        else if (action === 'pin') pr.onPin(t);
        else pr.onReservedSwipe?.(t);
      }, 120);
    },
    [byId],
  );

  // ---- layout ----
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
  }, []);
  const cardW = Math.max(0, size.w - CARD_LEFT - CARD_RIGHT);
  // The front card always sits SHEET_GAP above the capture sheet; if the fan behind it
  // would not fit above, the fan squeezes (fan < 1) instead of pushing the card down.
  const cardTop = Math.max(COUNT_LINE + 16, size.h - bottomInset - SHEET_GAP - CARD_H);
  const fan = Math.min(1, Math.max(0.35, (cardTop - COUNT_LINE - 16) / FAN_H));
  const trackTop = cardTop - FAN_H * fan;
  // The scrubber stops 12pt above the capture sheet so the peek never covers it.
  const trackH = Math.max(0, Math.min(cardTop + CARD_H, size.h - bottomInset - 12 - 22) - trackTop);

  const months = useMemo(() => thoughts.map((t) => monthKey(t.createdAt)), [thoughts]);
  const labels = useMemo(() => thoughts.map((t) => shortDate(t.createdAt)), [thoughts]);

  const stackStyle = useAnimatedStyle(() => ({ opacity: stackFade.value }));
  const countStyle = useAnimatedStyle(() => {
    const max = maxIdx.value;
    const depth = Math.min(SHOW, max - clamp(p.value, 0, max));
    return {
      opacity: visible.value,
      transform: [{ translateY: cardTop + stackY(depth, fan) - 8 - COUNT_LINE }],
    };
  });

  // A fixed pool of slots, keyed by slot. Slot s shows the one index in [front-6, front+11] with
  // index % POOL === s, so a slot only changes thought while it is invisible (fallen, or deeper
  // than the fan), and no card ever mounts or remounts while it can be seen.
  const slots: { slot: number; index: number }[] = [];
  for (let s = 0; s < POOL; s++) {
    const lo = frontIndex - (POOL - AHEAD);
    const index = lo + ((((s - lo) % POOL) + POOL) % POOL);
    if (index >= 0 && index < N) slots.push({ slot: s, index });
  }

  return (
    <View style={styles.root} onLayout={onLayout}>
      {N === 0 ? (
        <EmptyStack bottomInset={bottomInset} />
      ) : size.w > 0 ? (
        <>
          <GestureDetector gesture={pan}>
            <Animated.View style={[StyleSheet.absoluteFill, stackStyle]}>
              {slots.map(({ slot, index: i }) => {
                const t = thoughts[i];
                return (
                  <StackCard
                    key={`slot-${slot}`}
                    index={i}
                    zIndex={(N - i) * Z_GAP}
                    thought={t}
                    isFront={i === frontIndex}
                    interactive={i >= frontIndex}
                    more={moreLabel(i, N)}
                    cardW={cardW}
                    cardTop={cardTop}
                    fan={fan}
                    debug={debug}
                    p={p}
                    maxIdx={maxIdx}
                    solo={solo}
                    swipeX={swipeX}
                    pop={pop}
                    onPressCard={onPressCard}
                    onAction={onAction}
                    onSwipeDetent={onSwipeDetent}
                    onSwipeCommit={onSwipeCommit}
                  />
                );
              })}
            </Animated.View>
          </GestureDetector>

          <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            style={[styles.count, { left: CARD_LEFT, width: cardW }, countStyle]}
          >
            {moreLabel(frontIndex, N)}
          </Animated.Text>

          <DateScrubber
            p={p}
            maxIdx={maxIdx}
            target={target}
            visible={visible}
            grabbing={grabbing}
            stackFade={stackFade}
            top={trackTop}
            height={trackH}
            months={months}
            labels={labels}
            notify={notify}
            pulse={pulse}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'visible' },
  count: {
    position: 'absolute',
    top: 0,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: COUNT_LINE,
    color: tokens.color.faint,
  },
});
