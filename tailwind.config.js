/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saenggi: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4d9a8',
          300: '#ecbc6d',
          400: '#e49d3a',
          500: '#d4831c',
          600: '#b86514',
          700: '#954d13',
          800: '#793e16',
          900: '#633415',
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
        serif: ['Noto Serif KR', 'serif'],
      },
    },
  },
  plugins: [],
}

