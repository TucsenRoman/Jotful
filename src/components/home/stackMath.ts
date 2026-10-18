// Rolodex geometry and motion (design/mocks/r6/NOTES.md, motion.js, round 5+).
// One number drives the stack: p = cards fallen so far (0 = newest in front).
const tokens = require('../../theme/tokens');

export const CARD_H = 244;
export const CARD_LEFT = 36; // left gutter kept for the date scrubber
export const CARD_RIGHT = tokens.space.margin as number; // 16
export const SHEET_GAP = 12; // front card bottom sits this far above the capture sheet

export const D = 320; // drag per card, 1:1 finger tracking
export const STEP = [60, 56, 52, 48]; // each card behind sits this much higher
export const SHOW = 4; // cards visible behind the front one
export const FAN_H = STEP.reduce((a, b) => a + b, 0);
export const SCALE_STEP = 0.06;
export const DIM_STEP = 0.025;
export const ROT_MAX = 84;
export const GROW = 0.06;
export const FADE_FROM = 0.7;
export const COMMIT = 0.35;
export const FLICK = 0.5; // px/ms
export const RUBBER = 0.3;
export const JUMP = 2; // scrubber jumps past this many cards skip the fall

// tokens.motion.spring = { duration, dampingRatio } -> stiffness / damping (mass 1),
// exactly as the mock's integrator does it, so it behaves the same on every Reanimated version.
const W = (2 * Math.PI) / (tokens.motion.spring.duration / 1000);
export const SPRING = {
  mass: 1,
  stiffness: W * W,
  damping: 2 * tokens.motion.spring.dampingRatio * W,
};

export function stackY(d: number) {
  'worklet';
  const dc = Math.min(Math.max(d, 0), SHOW);
  let y = 0;
  let i = 0;
  for (; i < Math.floor(dc); i++) y += STEP[i];
  if (i < SHOW) y += STEP[i] * (dc - i);
  return -y;
}

export function clamp(x: number, a: number, b: number) {
  'worklet';
  return Math.min(b, Math.max(a, x));
}

export function rubber(raw: number, max: number) {
  'worklet';
  return raw > max ? max + (raw - max) * RUBBER : raw < 0 ? raw * RUBBER : raw;
}

export function unrubber(v: number, max: number) {
  'worklet';
  return v > max ? max + (v - max) / RUBBER : v < 0 ? v / RUBBER : v;
}

export type CardPose = { y: number; rot: number; scale: number; dim: number; opacity: number };

// Pose of the card at time-order index i for a given p.
export function poseFor(i: number, p: number): CardPose {
  'worklet';
  if (p < 0) {
    // Rubber band at the newest end: the front card lifts a little, the rest stay put.
    const dc = Math.min(i, SHOW);
    return {
      y: i === 0 ? p * D : stackY(i),
      rot: 0,
      scale: 1 - SCALE_STEP * dc,
      dim: DIM_STEP * dc,
      opacity: clamp(SHOW + 1 - i, 0, 1),
    };
  }
  const f = Math.floor(p);
  const t = p - f;
  const k = i - f;
  if (k < 0) return { y: D, rot: ROT_MAX, scale: 1 + GROW, dim: 0, opacity: 0 };
  if (k === 0) {
    return {
      y: D * t,
      rot: ROT_MAX * t,
      scale: 1 + GROW * t,
      dim: 0,
      opacity: clamp((1 - t) / (1 - FADE_FROM), 0, 1),
    };
  }
  const d = k - t;
  const dc = Math.min(d, SHOW);
  return {
    y: stackY(d),
    rot: 0,
    scale: 1 - SCALE_STEP * dc,
    dim: DIM_STEP * dc,
    opacity: clamp(SHOW + 1 - d, 0, 1),
  };
}
