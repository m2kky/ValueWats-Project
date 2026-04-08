/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ffffef',
          100: '#fffed9',
          200: '#f7f9a6',
          300: '#eef65f',
          400: '#e6f42d',
          500: '#e2f300',
          600: '#b8c300',
          700: '#8f9500',
          800: '#7a7839',
          900: '#232318',
        },
        brand: {
          dark: '#232318',
          accent: '#e2f300',
          olive: '#7a7839',
          cream: '#fffed9',
        },
      },
    },
  },
  plugins: [],
}
