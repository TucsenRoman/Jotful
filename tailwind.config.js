/** @type {import('tailwindcss').Config} */
const t = require('./src/theme/tokens');

const prefixed = (prefix, map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [`${prefix}-${k}`, v]));

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Reskin tokens (src/theme/tokens.js): bg-page, text-ink, bg-tag-music, bg-tint-music…
        ...t.color,
        ...prefixed('tag', t.tag),
        ...prefixed('on-tag', t.tagOn),
        ...prefixed('tint', t.tagTint),
        ...prefixed('pilltint', t.tagPillTint),
        // Old warm-paper look: removed screen by screen as the reskin lands.
        unsorted: {
          canvas: '#FAF8F3',
          ink: '#242019',
          mist: '#F1EEE7',
          line: '#E4DFD6',
          quiet: '#9B9187',
          persimmon: '#EF705A',
          blush: '#F8D8D1',
          moss: '#74876A',
          cream: '#FFFDF8',
          roast: '#242019'
        }
      },
      fontSize: Object.fromEntries(Object.entries(t.type).map(([k, [s, l]]) => [k, [`${s}px`, `${l}px`]])),
      borderRadius: { card: `${t.radius.card}px`, media: `${t.radius.media}px`, sheet: `${t.radius.sheet}px`, homecard: `${t.radius.homeCard}px` },
      spacing: { margin: `${t.space.margin}px`, control: `${t.size.control}px` }
    }
  },
  plugins: []
};
