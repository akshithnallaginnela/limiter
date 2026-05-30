/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We enforce clean dark mode styling throughout
  theme: {
    extend: {
      colors: {
        background: "#f8fafc", // slate-50
        card: "rgba(255, 255, 255, 0.7)", // glass white
        border: "rgba(226, 232, 240, 0.8)", // slate-200
        primary: {
          DEFAULT: "#6366f1", // Indigo theme - vibrant & colorful
          hover: "#4f46e5"
        },
        accent: {
          blue: "#3b82f6",
          green: "#10b981",
          purple: "#8b5cf6"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
