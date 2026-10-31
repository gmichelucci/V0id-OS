/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        voidDark: '#060609',
        voidPanel: '#0c0c12',
        voidBorder: '#1a1a24'
      }
    },
  },
  plugins: [],
}
