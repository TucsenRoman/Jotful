/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        unsorted: {
          canvas: '#F8F8F6',
          ink: '#1A2019',
          muted: '#718071',
          pine: '#263D2A',
          mist: '#ECEFEA',
          line: '#DDE2DB',
          soft: '#EBEEE8'
        }
      }
    }
  },
  plugins: []
};
