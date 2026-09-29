/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E0E0D",
        paper: "#FFFFFF",
        // One accent, two weights: the lighter one on dark sections, the deeper one on light sections.
        ember: { DEFAULT: "#FF8A4C", deep: "#C2410C" },
        smoke: "#8C8A85",
      },
      fontFamily: {
        sans: ['"General Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
      },
      screens: {
        xs: "450px",
      },
    },
  },
  plugins: [],
};
