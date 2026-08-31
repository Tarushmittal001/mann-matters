import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#0E3B33",
          950: "#06211C",
          900: "#0A2E28",
          800: "#0E3B33",
          700: "#13483E",
          600: "#1A5A4D",
          500: "#247261",
          100: "#E3EDE8",
        },
        ivory: {
          DEFAULT: "#F7F4EE",
          light: "#FCFAF6",
          dark: "#EFEAE0",
        },
        sage: {
          DEFAULT: "#A8C3B5",
          light: "#D9E6DE",
          dark: "#86A593",
        },
        gold: {
          DEFAULT: "#C8A45D",
          light: "#DCC28C",
          dark: "#A98943",
        },
        ink: "#1F2D28",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        deva: ["var(--font-deva)", "serif"],
      },
      maxWidth: {
        measure: "68ch",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        lift: "0 1px 2px rgba(14,59,51,0.05), 0 8px 24px rgba(14,59,51,0.07)",
        bloom: "0 2px 6px rgba(14,59,51,0.06), 0 24px 48px -12px rgba(14,59,51,0.18)",
        glass: "0 8px 32px rgba(14,59,51,0.10)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-soft": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(19,72,62,0.40)" },
          "70%": { boxShadow: "0 0 0 16px rgba(19,72,62,0)" },
        },
        breathe: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-12px) scale(1.03)" },
        },
        "drift-slow": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(10px, -16px)" },
        },
        fadein: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 48s linear infinite",
        "pulse-soft": "pulse-soft 2.8s ease-out infinite",
        breathe: "breathe 9s ease-in-out infinite",
        "drift-slow": "drift-slow 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
