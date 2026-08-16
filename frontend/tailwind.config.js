/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: "rgba(255, 255, 255, 0.03)",
        surfaceHover: "rgba(255, 255, 255, 0.05)",
        primary: "#00E5B0",
        secondary: "#00FFC6",
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
