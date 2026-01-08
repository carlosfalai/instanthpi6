import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#00f2ff", // Neon Cyan
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#bf00ff", // Electric Purple
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "#00f2ff",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "rgba(10, 10, 10, 0.8)",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "#00f2ff",
          "primary-foreground": "#000000",
          accent: "rgba(255, 255, 255, 0.05)",
          "accent-foreground": "#ffffff",
          border: "rgba(255, 255, 255, 0.1)",
          ring: "#00f2ff",
        },
        "color-1": "hsl(var(--color-1))",
        "color-2": "hsl(var(--color-2))",
        "color-3": "hsl(var(--color-3))",
        "color-4": "hsl(var(--color-4))",
        "color-5": "hsl(var(--color-5))",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        rainbow: {
          "0%": { "background-position": "0%" },
          "100%": { "background-position": "200%" },
        },
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
        aura: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        warp: {
          "0%": { transform: "perspective(1000px) rotateX(0deg)" },
          "100%": { transform: "perspective(1000px) rotateX(2deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        rainbow: "rainbow var(--speed, 2s) infinite linear",
        grid: "grid 15s ease infinite",
        aura: "aura 5s ease-in-out infinite",
        warp: "warp 3s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    function ({ addUtilities }) {
      const newUtilities = {
        ".scrollbar-thin": {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
        },
        ".scrollbar-thumb-gray-600": {
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#4B5563",
            borderRadius: "3px",
          },
        },
        ".scrollbar-track-transparent": {
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;
