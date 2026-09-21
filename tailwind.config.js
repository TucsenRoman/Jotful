/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        unsorted: {
          canvas: '#F5F0E6',
          ink: '#242019',
          muted: '#74876A',
          pine: '#242019',
          mist: '#ECE8DB',
          line: '#DED6C7',
          soft: '#EEE8DC',
          persimmon: '#EF705A',
          moss: '#74876A',
          cream: '#F5F0E6',
          roast: '#242019'
        }
      }
    }
  },
  plugins: []
};
