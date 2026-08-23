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

        /* ── the accent family ────────────────────────────────────────
           Six colours borrowed from things people here already know by
           sight: turmeric, saffron, holi powder, jamun, indigo dye and
           a peacock's neck. Hindi names on purpose — they never collide
           with Tailwind's own `rose`/`indigo`/`teal` scales.

           Each family carries an `ink` shade. The vivid DEFAULT is for fills,
           icons and anything on the dark forest sections; `ink` is the only
           one safe for body text on ivory (all four clear 4.5:1 there). */
        haldi: { DEFAULT: "#F0B429", light: "#FBD871", dark: "#C68B12", ink: "#8A5A00" },
        kesar: { DEFAULT: "#E36A3B", light: "#F79466", dark: "#BC4A20", ink: "#9A3410" },
        gulaal: { DEFAULT: "#E14D7C", light: "#F589AC", dark: "#B62F5C", ink: "#A82454" },
        jamun: { DEFAULT: "#7C4D9B", light: "#A87DC4", dark: "#5B3475", ink: "#5B3475" },
        neel: { DEFAULT: "#4356CE", light: "#8490EC", dark: "#2C3A9B", ink: "#2C3A9B" },
        mor: { DEFAULT: "#0E9FA6", light: "#4FCBD1", dark: "#087178", ink: "#076166" },
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
      backgroundImage: {
        sunrise: "linear-gradient(100deg,#F0B429 0%,#E36A3B 48%,#E14D7C 100%)",
        dusk: "linear-gradient(100deg,#E14D7C 0%,#7C4D9B 52%,#4356CE 100%)",
        tide: "linear-gradient(100deg,#0E9FA6 0%,#247261 55%,#4356CE 100%)",
        spectrum:
          "linear-gradient(90deg,#F0B429,#E36A3B,#E14D7C,#7C4D9B,#4356CE,#0E9FA6)",
      },
      boxShadow: {
        lift: "0 1px 2px rgba(14,59,51,0.05), 0 8px 24px rgba(14,59,51,0.07)",
        bloom: "0 2px 6px rgba(14,59,51,0.06), 0 24px 48px -12px rgba(14,59,51,0.18)",
        glass: "0 8px 32px rgba(14,59,51,0.10)",
        haldi: "0 12px 32px -10px rgba(240,180,41,0.55)",
        kesar: "0 12px 32px -10px rgba(227,106,59,0.50)",
        gulaal: "0 12px 32px -10px rgba(225,77,124,0.45)",
        neel: "0 12px 32px -10px rgba(67,86,206,0.45)",
        mor: "0 12px 32px -10px rgba(14,159,166,0.45)",
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
        /* decorative colour motion */
        "mesh-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(4%,-6%,0) scale(1.12)" },
          "66%": { transform: "translate3d(-5%,4%,0) scale(0.94)" },
        },
        shimmer: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "bob-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        marquee: "marquee 48s linear infinite",
        "pulse-soft": "pulse-soft 2.8s ease-out infinite",
        breathe: "breathe 9s ease-in-out infinite",
        "drift-slow": "drift-slow 12s ease-in-out infinite",
        "mesh-drift": "mesh-drift 22s ease-in-out infinite",
        shimmer: "shimmer 9s ease-in-out infinite",
        "bob-soft": "bob-soft 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
