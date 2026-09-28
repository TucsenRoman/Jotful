/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        unsorted: {
          canvas: '#FAF8F3',
          ink: '#242019',
          muted: '#74876A',
          pine: '#242019',
          mist: '#F1EEE7',
          line: '#E4DFD6',
          soft: '#F4F1EB',
          quiet: '#9B9187',
          persimmon: '#EF705A',
          moss: '#74876A',
          cream: '#FFFDF8',
          roast: '#242019'
        }
      }
    }
  },
  plugins: []
};
