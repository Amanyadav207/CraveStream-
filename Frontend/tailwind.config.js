/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff5200", // Zomato-ish orange
        dark: "#121212",
        card: "#1e1e1e",
        glass: "rgba(255, 255, 255, 0.1)",
      }
    },
  },
  plugins: [],
}
