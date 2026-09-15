import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          fog: "#EDEFEA",   // page background — cool poured-concrete grey, not warm cream
          paper: "#F7F8F5",
          line: "#D7DAD2",  // hairline borders
        },
        ink: {
          DEFAULT: "#21221E",
          soft: "#4A4C45",
        },
        concrete: {
          900: "#232420",
          800: "#2E2F2A",
        },
        brass: {
          DEFAULT: "#C08A3E",
          dark: "#9C6C2B",
          light: "#E4C089",
        },
        slate: {
          blueprint: "#3E5259",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
};
export default config;
