/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3E2723',
        accent: '#FF6F00',
        surface: '#FFFFFF',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(255, 160, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
