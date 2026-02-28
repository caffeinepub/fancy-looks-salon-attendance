import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "sans-serif"],
        sans: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        // Salon-specific custom colors
        salon: {
          rose: "oklch(var(--salon-rose))",
          "rose-deep": "oklch(var(--salon-rose-deep))",
          "rose-light": "oklch(var(--salon-rose-light))",
          gold: "oklch(var(--salon-gold))",
          "gold-light": "oklch(var(--salon-gold-light))",
          cream: "oklch(var(--salon-cream))",
          charcoal: "oklch(var(--salon-charcoal))",
        },
        late: {
          bg: "oklch(var(--late-bg))",
          text: "oklch(var(--late-text))",
          border: "oklch(var(--late-border))",
        },
        present: {
          bg: "oklch(var(--present-bg))",
          text: "oklch(var(--present-text))",
        },
        absent: {
          bg: "oklch(var(--absent-bg))",
          text: "oklch(var(--absent-text))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        salon: "0 4px 6px -1px oklch(0.42 0.18 10 / 0.08), 0 2px 4px -1px oklch(0.42 0.18 10 / 0.04)",
        "salon-lg": "0 10px 25px -5px oklch(0.42 0.18 10 / 0.15), 0 4px 10px -2px oklch(0.42 0.18 10 / 0.08)",
        gold: "0 4px 15px oklch(0.72 0.14 75 / 0.2), 0 1px 4px oklch(0.72 0.14 75 / 0.1)",
      },
      backgroundImage: {
        "salon-hero": "linear-gradient(135deg, oklch(0.38 0.18 10) 0%, oklch(0.45 0.2 355) 30%, oklch(0.32 0.12 20) 70%, oklch(0.22 0.08 30) 100%)",
        "gold-shimmer": "linear-gradient(135deg, oklch(0.75 0.14 75) 0%, oklch(0.82 0.1 80) 40%, oklch(0.70 0.16 70) 100%)",
        "rose-gradient": "linear-gradient(135deg, oklch(0.52 0.22 10) 0%, oklch(0.42 0.18 10) 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 3s linear infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "slide-in-right": "slideInRight 0.4s ease-out forwards",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
