/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // make sure React files are included
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
