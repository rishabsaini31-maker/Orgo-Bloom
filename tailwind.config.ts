import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        accent: {
          50: "#fefce8",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        earth: {
          50: "#faf5f0",
          100: "#f5ebe0",
          200: "#e8d7c6",
          300: "#d4bfaa",
          400: "#bfa08f",
          500: "#9d7f6f",
          600: "#7d6456",
          700: "#6b5646",
          800: "#5a483a",
          900: "#4a3a2a",
        },
      },
      boxShadow: {
        elegant: "0 10px 40px rgba(0, 0, 0, 0.08)",
        "elegant-lg": "0 20px 60px rgba(0, 0, 0, 0.12)",
        "elegant-xl": "0 30px 80px rgba(0, 0, 0, 0.15)",
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
