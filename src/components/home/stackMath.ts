// Rolodex geometry and motion (design/mocks/r6/NOTES.md, motion.js, round 5+).
// One number drives the stack: p = cards fallen so far (0 = newest in front).
const tokens = require('../../theme/tokens');

export const CARD_H = 244;
export const CARD_LEFT = tokens.space.margin as number; // 16: cards centred, equal side margins
export const CARD_RIGHT = tokens.space.margin as number; // 16
export const SHEET_GAP = 32; // front card bottom sits this far above the capture sheet (12 was cut off on device)

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
export const POP_RISE = 26; // how far below its place a new back card starts
export const JUMP = 2; // scrubber jumps past this many cards skip the fall

// tokens.motion.spring = { duration, dampingRatio } -> stiffness / damping (mass 1),
// exactly as the mock's integrator does it, so it behaves the same on every Reanimated version.
const W = (2 * Math.PI) / (tokens.motion.spring.duration / 1000);
export const SPRING = {
  mass: 1,
  stiffness: W * W,
  damping: 2 * tokens.motion.spring.dampingRatio * W,
};

// k (0-1) squeezes the fan on short screens so the front card never slides under the sheet.
export function stackY(d: number, k = 1) {
  'worklet';
  const dc = Math.min(Math.max(d, 0), SHOW);
  let y = 0;
  let i = 0;
  for (; i < Math.floor(dc); i++) y += STEP[i];
  if (i < SHOW) y += STEP[i] * (dc - i);
  return -y * k;
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

export type CardPose = { y: number; scaleX: number; scaleY: number; dim: number; opacity: number };

// Ends of the stack: a short, firm stretch (never a falling card), at most END_PULL.
const END_PULL = 28;
function stretch(over: number) {
  'worklet';
  return END_PULL * (1 - Math.exp(-Math.abs(over) * D / END_PULL / 2)) * Math.sign(over);
}

// Pose of the card at time-order index i for a given p (max = last index).
export function poseFor(i: number, p: number, fan = 1, max = Number.MAX_SAFE_INTEGER): CardPose {
  'worklet';
  if (p < 0 || p > max) {
    const atEnd = p < 0 ? 0 : max;
    const pull = stretch(p - atEnd);
    const d = i - atEnd;
    if (d < 0) return { y: D, scaleX: 1 + GROW, scaleY: 0.1, dim: 0, opacity: 0 };
    const dc = Math.min(d, SHOW);
    return {
      y: d === 0 ? pull : stackY(d, fan),
      scaleX: 1 - SCALE_STEP * dc,
      scaleY: 1 - SCALE_STEP * dc,
      dim: DIM_STEP * dc,
      opacity: clamp(SHOW + 1 - d, 0, 1),
    };
  }
  const f = Math.floor(p);
  const t = p - f;
  const k = i - f;
  if (k < 0) return { y: D, scaleX: 1 + GROW, scaleY: 0.1, dim: 0, opacity: 0 };
  if (k === 0) {
    // Flat fall for now (user, 2026-10-18): slide down, grow a little, fade. The forward
    // tilt comes back once it can render without flicker on iOS.
    return {
      y: D * t,
      scaleX: 1 + GROW * t,
      scaleY: 1 + GROW * t,
      dim: 0,
      opacity: clamp((1 - t) / (1 - FADE_FROM), 0, 1),
    };
  }
  const d = k - t;
  const dc = Math.min(d, SHOW);
  const sc = 1 - SCALE_STEP * dc;
  // A card arriving at the back pops up into the fan: from half size and a little lower,
  // easing up to its place as it fades in (e = 1 hidden, 0 in place).
  const e = clamp(d - SHOW, 0, 1);
  const pop = e * e * (3 - 2 * e);
  return {
    y: stackY(d, fan) + POP_RISE * pop,
    scaleX: sc * (1 - 0.5 * pop),
    scaleY: sc * (1 - 0.5 * pop),
    dim: DIM_STEP * dc,
    opacity: clamp(SHOW + 1 - d, 0, 1),
  };
}

// Dev-only switches (Settings > Developer) to find what makes the stack flicker on device.
export type StackDebug = { flat: boolean; noShadow: boolean; plain: boolean };
