// Jotful design tokens: the one source of truth for the Oct 2026 reskin
// (design/README.md, BRAND.md). tailwind.config.js reads this file, so NativeWind
// classes (bg-page, text-ink, bg-tag-music…) and raw values for icon props
// (`tokens.color.ink`) come from the same place. Components use the semantic
// names below, never raw hex. Light only today; `dark` is the brand book's proposal.

// Tier 1: primitives. Apple system values (APPLE_SPECS.md) plus the brand's own.
const primitive = {
  white: '#FFFFFF',
  ink: '#020204',
  graphite: '#1C1C1E',
  graphite2: '#2C2C2E',
  grey6: '#F2F2F7',
  page: '#F2F1F6',
  grey: '#8E8E93',
  grey3: '#C7C7CC',
  blue: '#0A84FF',
  red: '#FF3B30',
  // Brand: only inside the moth's wings and the wordmark.
  persimmon: '#EF705A',
  mothGreen: '#58795C',
};

// Tag colours: one colour per tag, never two meanings. Bright on the pill; cards
// get a tint of it (see tagTint below).
const tag = {
  idea: '#F2B705',
  question: '#0A6CFF',
  movie: '#E5383B',
  music: '#E83E8C',
  book: '#F57C1F',
  place: '#2DA44E',
  person: '#8E44EC',
  todo: '#0FA3A3',
};

// Text drawn on each tag pill (Idea is light, so it takes ink).
const tagOn = {
  idea: primitive.ink,
  question: primitive.white,
  movie: primitive.white,
  music: primitive.white,
  book: primitive.white,
  place: primitive.white,
  person: primitive.white,
  todo: primitive.white,
};

// Tier 2: semantic. Name by job.
const color = {
  page: primitive.page, // behind home
  surface: primitive.white, // detail page, sheets, glass buttons
  card: primitive.grey6, // detail content card, info rows, grey pills
  ink: primitive.ink, // titles, text, the black Ask AI button
  onInk: primitive.white,
  secondary: 'rgba(60,60,67,0.6)', // meta, captions
  faint: 'rgba(60,60,67,0.3)', // the floating "13 more" count
  separator: 'rgba(60,60,67,0.29)',
  fill: 'rgba(120,120,128,0.12)', // grey pill and icon-circle fill
  action: primitive.blue, // Save, "Adjust" links only
  danger: primitive.red,
  resolveBack: primitive.graphite2, // swipe-right circle
  pinBack: primitive.white, // swipe-left circle
  voiceCard: primitive.graphite, // dark voice-only card
};

const dark = {
  page: '#000000',
  surface: primitive.graphite,
  card: primitive.graphite2,
  ink: primitive.white,
  onInk: primitive.ink,
  secondary: 'rgba(235,235,245,0.6)',
  faint: 'rgba(235,235,245,0.3)',
  separator: 'rgba(84,84,88,0.6)',
  fill: 'rgba(118,118,128,0.24)',
};

// Card tint: a share of the tag colour over white (home cards 9%, filter pills 15%).
const tint = { card: 0.09, pill: 0.15 };

function mix(hex, amount, base = '#FFFFFF') {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [a, b] = [h(hex), h(base)];
  return '#' + a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount)).toString(16).padStart(2, '0')).join('').toUpperCase();
}
const tagTint = Object.fromEntries(Object.entries(tag).map(([k, v]) => [k, mix(v, tint.card)]));
const tagPillTint = Object.fromEntries(Object.entries(tag).map(([k, v]) => [k, mix(v, tint.pill)]));

// Type: Apple Dynamic Type steps (pt / line height). System font everywhere;
// Fraunces only for the wordmark.
const type = {
  largeTitle: [34, 41],
  title2: [22, 28],
  body: [17, 22],
  subhead: [15, 20],
  footnote: [13, 18],
  caption: [12, 16],
  caption2: [11, 13],
};
const font = { wordmark: 'Fraunces_600SemiBold' };

// Space and shape (APPLE_SPECS.md section 8).
const space = { margin: 16, gap: 12, inner: 16, iconGap: 6, stack: 8 };
const size = { control: 44, swipeCircle: 52, voiceRing: 88 };
const radius = { card: 24, media: 12, sheet: 24, pill: 999, homeCard: 20 };

// Motion (design/mocks/r6/NOTES.md).
const motion = {
  spring: { duration: 400, dampingRatio: 0.8 },
  fade: 180,
  countFadeOut: 600,
  swipeDetent: 64,
  swipeLong: 122,
  swipeClamp: 150,
};

module.exports = { primitive, tag, tagOn, tagTint, tagPillTint, color, dark, tint, type, font, space, size, radius, motion, mix };
