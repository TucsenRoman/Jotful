import { Lock, Mic } from "lucide-react-native";
import { useMemo, useRef } from "react";
import { View } from "react-native";
import {
  Gesture,
  GestureDetector,
  type GestureType,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { VoicePhase } from "./VoicePanel";

const tokens = require("../../theme/tokens");

export const micSize = 60;
const radius = micSize / 2;
// The lock target: a ring 88pt from the mic's centre (tokens.size.voiceRing).
const ringRadius: number = tokens.size.voiceRing;
const lockDistance = ringRadius - radius;
const dragStart = 6;

type Props = {
  phase: "idle" | VoicePhase;
  enabled: boolean;
  /** 1 while the recording is locked; the parent sets it for open("voice"). */
  lockedSV: SharedValue<number>;
  levelSV: SharedValue<number>;
  /** The sheet's own pan: it waits while a finger is on the mic. */
  sheetGesture?: GestureType;
  onHoldStart: () => void;
  onHoldRelease: () => void;
  onDragChange: (dragging: boolean) => void;
  onLock: () => void;
  onLockedTap: () => void;
};

/**
 * The one voice button. Hold = record, release = save. Drag away in any
 * direction: a faint ring appears 88pt out and a filled circle grows from the
 * mic with the drag; reaching the ring locks. Locked, it is a stop square: tap
 * to save. The mic itself never moves.
 */
export default function VoiceButton({
  phase,
  enabled,
  lockedSV,
  levelSV,
  sheetGesture,
  onHoldStart,
  onHoldRelease,
  onDragChange,
  onLock,
  onLockedTap,
}: Props) {
  const distance = useSharedValue(0);
  const ringShown = useSharedValue(0);
  const settle = useSharedValue(0);
  const pressed = useSharedValue(0);
  const dragging = useSharedValue(0);
  const startedLocked = useSharedValue(0);
  const lockedNow = useSharedValue(0);

  // Stable wrappers: the gesture is built once (per enabled/sheet change) so a
  // re-render mid-hold never rebuilds it under the finger.
  const handlers = useRef({
    onHoldStart,
    onHoldRelease,
    onDragChange,
    onLock,
    onLockedTap,
  });
  handlers.current = {
    onHoldStart,
    onHoldRelease,
    onDragChange,
    onLock,
    onLockedTap,
  };
  const js = useMemo(
    () => ({
      holdStart: () => handlers.current.onHoldStart(),
      holdRelease: () => handlers.current.onHoldRelease(),
      dragChange: (dragging: boolean) =>
        handlers.current.onDragChange(dragging),
      lock: () => handlers.current.onLock(),
      lockedTap: () => handlers.current.onLockedTap(),
    }),
    [],
  );

  const gesture = useMemo(() => {
    let pan = Gesture.Pan()
      .enabled(enabled)
      .minDistance(0)
      .shouldCancelWhenOutside(false)
      .onBegin(() => {
        startedLocked.value = lockedSV.value;
        lockedNow.value = 0;
        pressed.value = withTiming(1, { duration: 120 });
        if (lockedSV.value) return;
        distance.value = 0;
        settle.value = 0;
        runOnJS(js.holdStart)();
      })
      .onUpdate((event) => {
        if (startedLocked.value || lockedSV.value) return;
        const d = Math.sqrt(
          event.translationX * event.translationX +
            event.translationY * event.translationY,
        );
        distance.value = Math.min(d, lockDistance);
        const isDragging = d > dragStart ? 1 : 0;
        if (isDragging !== dragging.value) {
          dragging.value = isDragging;
          ringShown.value = withTiming(isDragging, { duration: 160 });
          runOnJS(js.dragChange)(isDragging === 1);
        }
        if (d >= lockDistance) {
          // Circle meets the ring: snap, lock, then shrink back into the button.
          lockedSV.value = 1;
          lockedNow.value = 1;
          dragging.value = 0;
          settle.value = withDelay(220, withTiming(1, { duration: 260 }));
          ringShown.value = withDelay(220, withTiming(0, { duration: 260 }));
          runOnJS(js.lock)();
        }
      })
      .onFinalize((event) => {
        pressed.value = withTiming(0, { duration: 160 });
        if (startedLocked.value) {
          const moved = Math.sqrt(
            event.translationX * event.translationX +
              event.translationY * event.translationY,
          );
          if (moved < 24) runOnJS(js.lockedTap)();
          return;
        }
        if (lockedNow.value) return;
        dragging.value = 0;
        ringShown.value = withTiming(0, { duration: 160 });
        distance.value = withTiming(0, { duration: 160 });
        runOnJS(js.holdRelease)();
      });
    if (sheetGesture) pan = pan.blocksExternalGesture(sheetGesture);
    return pan;
  }, [enabled, sheetGesture]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringShown.value,
    transform: [{ scale: 1 - settle.value * (1 - radius / ringRadius) }],
  }));
  const growStyle = useAnimatedStyle(() => {
    const r = radius + distance.value * (1 - settle.value);
    return {
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      left: radius - r,
      top: radius - r,
      opacity: (lockedNow.value ? 0.16 : 0.1) * ringShown.value,
    };
  });
  const haloOuter = useAnimatedStyle(() => {
    const show =
      pressed.value * (1 - ringShown.value) * (lockedSV.value ? 0 : 1);
    return {
      opacity: 0.07 * show,
      transform: [{ scale: 0.9 + levelSV.value * 0.3 }],
    };
  });
  const haloInner = useAnimatedStyle(() => {
    const show =
      pressed.value * (1 - ringShown.value) * (lockedSV.value ? 0 : 1);
    return {
      opacity: 0.08 * show,
      transform: [{ scale: 0.95 + levelSV.value * 0.15 }],
    };
  });
  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
  }));

  const halo = (inset: number) => ({
    position: "absolute" as const,
    left: -inset,
    top: -inset,
    width: micSize + inset * 2,
    height: micSize + inset * 2,
    borderRadius: radius + inset,
  });

  return (
    <View style={{ width: micSize, height: micSize }}>
      <Animated.View
        pointerEvents="none"
        style={[
          halo(lockDistance),
          {
            borderWidth: phase === "locking" ? 2.5 : 1.5,
            borderColor: tokens.color.ink,
          },
          ringStyle,
          // The faint ring is ink at 22%; it turns solid once it locks.
          phase === "locking" ? null : { borderColor: tokens.color.separator },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        className="bg-ink"
        style={[{ position: "absolute" }, growStyle]}
      />
      <Animated.View
        pointerEvents="none"
        className="bg-ink"
        style={[halo(22), haloOuter]}
      />
      <Animated.View
        pointerEvents="none"
        className="bg-ink"
        style={[halo(11), haloInner]}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            phase === "locked" || phase === "locking"
              ? "Save recording"
              : "Hold to talk"
          }
          className="bg-ink items-center justify-center"
          style={[
            { width: micSize, height: micSize, borderRadius: radius },
            micStyle,
          ]}
        >
          {phase === "locked" ? (
            <View
              className="bg-surface"
              style={{ width: 20, height: 20, borderRadius: 5 }}
            />
          ) : phase === "locking" ? (
            <Lock size={24} color={tokens.color.onInk} strokeWidth={2} />
          ) : (
            <Mic size={26} color={tokens.color.onInk} strokeWidth={1.9} />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
