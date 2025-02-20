/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik-Regular', 'sans-serif'],
        "rubik-bold": ['Rubik-Bold', 'sans-serif'],
        "rubik-extrabold":['Rubik-ExtraBold', 'sans-serif'],
        "rubik-medium":['Rubik-Medium', 'sans-serif'],
        "rubik-semibold":['Rubik-Semibold', 'sans-serif'],
        "rubik-light":['Rubik-light', 'sans-serif'],
      },
      colors: {
        primary: '#4F46E5',
        secondary: '#6B7280',
      },
    },
  },
  plugins: [],
}

