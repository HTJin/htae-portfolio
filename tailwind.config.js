const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./{src,mdx}/**/*.{js,mjs,jsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        '2xs': '.6875rem',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Mona Sans', ...defaultTheme.fontFamily.sans],
      },
      opacity: {
        2.5: '0.025',
        7.5: '0.075',
        15: '0.15',
      },
      animation: {
        'color-in': 'color-in 3s ease-out forwards',
      },
      keyframes: {
        'color-in': {
          '0%': { 'background-position': '0% 0%' },
          '25%': { 'background-position': '25% 0%' },
          '50%': { 'background-position': '50% 0%' },
          '75%': { 'background-position': '75% 0%' },
          '100%': { 'background-position': '100% 0%' },
        },
      },
    },
  },
  plugins: [],
}
