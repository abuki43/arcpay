/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/sdk/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border, 217 33% 17%))",
        input: "hsl(var(--input, 217 33% 17%))",
        ring: "hsl(var(--ring, 142 71% 45%))",
        background: "hsl(var(--background, 222 47% 6%))",
        foreground: "hsl(var(--foreground, 210 40% 98%))",
        primary: {
          DEFAULT: "hsl(var(--primary, 142 71% 45%))",
          foreground: "hsl(var(--primary-foreground, 222 47% 6%))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 217 33% 17%))",
          foreground: "hsl(var(--secondary-foreground, 210 40% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 217 33% 14%))",
          foreground: "hsl(var(--muted-foreground, 215 20% 65%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 173 80% 40%))",
          foreground: "hsl(var(--accent-foreground, 222 47% 6%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 222 47% 9%))",
          foreground: "hsl(var(--card-foreground, 210 40% 98%))",
        },
        arc: {
          500: '#22c55e',
          600: '#16a34a',
          blue: '#2775CA',
          dark: '#0B0F17',
          card: '#131B2A',
        }
      },
      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
      },
    },
  },
  plugins: [],
};
