/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'dark-green': '#1A3C34', // Navbar and hero background
        'lime-green': '#32CD32', // "View Services" button
      },
    },
  },
  plugins: [],
};